import subprocess
import re
import io
import wave
import array
import http.server
import socketserver

PORT = 5746

def log(id, info):
    print(f"[{id}] {info}")

def error(id, info, ex = None):
    print(f"ERROR [{id}] {info} {("[" + (ex.message if hasattr(ex, 'message') else repr(ex)) + "]") if ex else ""}")


class VideoProcessor:
    fps = None

    scenes01 = None
    scenes04 = None
    loudness = None
    frameinfo = None

    def __init__(self, id):
        self.id = id
        log(self.id, "Create new videoprocessor")
        #FIXME test avi mp4 

    def ts2frame(self, ts):
        return round(float(ts) * float(self.fps))

    def getScenes(self):
        if self.scenes04:
            return (self.scenes01, self.scenes04)
        
        try:
            #cmd = ['ffmpeg', '-i', f"hd/{self.id}.mp4", "-filter:v", "select='gt(scene,0.02)',showinfo", "-f", "null", "-"]
            #cmd = ['ffmpeg', '-i', f"hd/{self.id}.mp4", "-filter:v", "select='gt(scene,0.03)',showinfo", "-f", "null", "-"]
            cmd = ['ffmpeg', '-i', f"hd/{self.id}.mp4", "-filter:v", "select='gt(scene,0.04)',showinfo", "-f", "null", "-"]
            log(self.id, "Scan scenes 0.05 {cmd}")
            result = subprocess.run(cmd , capture_output=True, text=True)
            lines = result.stderr.splitlines()
            self.scenes01 = []
            for l in lines:
                m = re.match(r".*showinfo.*pts_time:([0-9.]+) .*", l)
                if m:
                    self.scenes01.append(self.ts2frame(m.group(1)))

            cmd = ['ffmpeg', '-i', f"hd/{self.id}.mp4", "-filter:v", "select='gt(scene,0.2)',showinfo", "-f", "null", "-"]
            log(self.id, "Scan scenes 0.2 {cmd}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            lines = result.stderr.splitlines()
            self.scenes04 = []
            for l in lines:
                m = re.match(r".*showinfo.*pts_time:([0-9.]+) .*", l)
                if m:
                    self.scenes04.append(self.ts2frame(m.group(1)))
        except Exception as e:
            error(self.id, "Can't read scene cuts", e)
            return (None, None)

        return (self.scenes01, self.scenes04)

    def getLoudness(self):
        if self.loudness:
            return self.loudness

        try:
            ar = str(round(float(self.fps) * 100))
            cmd = ['ffmpeg', '-i', f"hd/{self.id}.mp4", "-ac", "1", "-sample_fmt", "s16", "-ar", ar, "-f", "wav", "-"]
            log(self.id, f"Scan audio {cmd}")
            result = subprocess.run(cmd, capture_output=True)
            w = wave.open(io.BytesIO(result.stdout))
            frames = w.readframes(-1)
            samples = array.array("h", frames)
            tmp = array.array("h")
            sum = 0
            max = 0
            l = len(samples)
            i = 0
            while i < l:
                sum += abs(samples[i])
                i += 1
                if i % 100 == 0:
                    sum = round(sum/100)
                    tmp.append(sum)
                    if sum > max:
                        max = sum
                    sum = 0
            self.loudness = array.array("B")
            for t in tmp:
                self.loudness.append(round(t / max * 200))
        except Exception as e:
            error(self.id,  "Can't scan audio", e)
            return (None, None)

        return self.loudness
    
    def getFrameinfo(self):
        if self.frameinfo:
            return self.frameinfo
        
        (s1, s4) = self.getScenes()
        la = self.getLoudness()
        res = array.array("B")
        res.append(0)
        res.append(0)
        res.append(0)
        for l in la:
            res.append(l)
        for fn in s1:
            if res[fn-1] < 250 and res[fn-2] < 250:
                res[fn] = 254 #FIXME test out of bounds
        for fn in s4:
            res[fn] = 255 #FIXME test out of bounds
        for i in range(2, len(res) - 3):
            if res[i] == 255:
                res[i-1] = 0
                res[i-2] = 0
                res[i+1] = 0
                res[i+2] = 0
        self.frameinfo = res
        return self.frameinfo

    def getFps(self):
        if self.fps:
            return self.fps
        
        try:
            cmd = ['ffprobe', f"hd/{self.id}.mp4"]
            log(self.id, "Scan fps {cmd}")
            result = subprocess.run(cmd , capture_output=True, text=True)
            lines = result.stderr.splitlines()
            self.scenes01 = []
            for l in lines:
                m = re.match(r".*, ([0-9.]+) fps,.*", l)
                if m:
                    self.fps = m.group(1)

        except Exception as e:
            error(self.id, "Can't read fps", e)
            return 0

        return self.fps

#vp = VideoProcessor("hd/4217-ashley")
#vp.getScenes()
#vp.getLoudness()
#vp.getFrameinfo()
#bp = 1
videoProcessor = None

class MyHandler(http.server.SimpleHTTPRequestHandler):

    def init(self, id):
        global videoProcessor
        if not videoProcessor or id != videoProcessor.id:
            videoProcessor = VideoProcessor(id)

    def do_GET(self): # a different self every time
        global videoProcessor

        log("HttpServer", f"serve GET {self.path}")
        m = re.match(r"/fps[?]id=(.+)", self.path)
        if m:
            log("HttpServer", f"Fps {m.group(1)}")
            self.init(m.group(1))
            self.send_response(200)
            self.send_header('Content-type', 'application/sceneinfo')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(videoProcessor.getFps().encode('utf-8'))
            log("HttpServer", f"Fps {m.group(1)} done")
            return            

        m = re.match(r"/sceneinfo[?]id=(.+)", self.path)
        if m:
            log("HttpServer", f"Sceneinfo {m.group(1)}")
            self.init(m.group(1))
            self.send_response(200)
            self.send_header('Content-type', 'application/sceneinfo')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(videoProcessor.getFrameinfo())
            log("HttpServer", f"Sceneinfo {m.group(1)} done")
            return            

        m = re.match(r"/gettime[?]id=(.+)", self.path)
        if m:
            log("HttpServer", f"Get Time {m.group(1)}")
            self.init(m.group(1))
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            try:
                with open(f"hd/{m.group(1)}.js") as f:
                    for l in f:
                        if re.match(r"^\d\d:\d\d:\d\d:\d\d\d", l):
                            self.wfile.write(bytes(l, "utf-8"))
                log("HttpServer", f"Get Time {m.group(1)} done")
            except Exception as e:
                error("HttpServer", "Get Time {m.group(1)} failed", e)
                self.wfile.write(bytes("00:00:00:000\n", "utf-8"))
            return            

        log("HttpServer", f"File {self.path}")
        res = http.server.SimpleHTTPRequestHandler.do_GET(self) 
        log("HttpServer", f"File {self.path} done")
        return res

    def do_POST(self): # a different self every time
        log("HttpServer", f"serve POST {self.path}")
        m = re.match(r"/savetime[?]id=(.+)", self.path)
        if m:
            log("HttpServer", f"Save Time {m.group(1)}")
            self.init(m.group(1))
            name = re.sub("^[^/]*/", "", m.group(1))
            length = int(self.headers['Content-Length'])
            content = self.rfile.read(length)
            
            with open(f"hd/{m.group(1)}.js", 'w') as f:
                f.write(f'fpsFromLocalFile["{name}"] = {videoProcessor.getFps()};\n')
                f.write(f'loadedFromLocalFile["{name}"] = `\n')
                f.write(content.decode("utf-8"))
                f.write("\n;`\n")

            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(bytes("OK", "utf-8"))
            log("HttpServer", f"Save Time {m.group(1)} done")
            return

        log("HttpServer", f"File {self.path}")
        res = http.server.SimpleHTTPRequestHandler.do_POST(self) 
        log("HttpServer", f"File {self.path} done")
        return res
        

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    log("HttpServer", f"Serving at port {PORT}")
    httpd.serve_forever()
