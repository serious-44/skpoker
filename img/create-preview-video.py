import os
import re

def scanTime(t):
    m = re.match(r"(\d\d):(\d\d):(\d\d):(\d\d\d)", t)
    return (int(m[1]) * 60 + int(m[2])) * 60 + int(m[3]) + int(m[4]) / 1000

previewShow = {}

files = os.listdir("hd")
for fn in files:
    m = re.match(".*[.]js", fn)
    if m:
        # search for the longest sow, no zoom, 4 clothes
        shows4 = []
        shows3 = []
        start = None
        state = "start"
        with open(f'hd/{fn}') as f:
            for line in f:
                parts = line.strip().split()
                if state == "show4" and len(parts) >= 1 and re.match(r"\d\d:\d\d:\d\d:\d\d\d", parts[0]):
                    shows4.append([scanTime(start), scanTime(parts[0])])
                    state = "start"
                if state == "show3" and len(parts) >= 1 and re.match(r"\d\d:\d\d:\d\d:\d\d\d", parts[0]):
                    shows3.append([scanTime(start), scanTime(parts[0])])
                    state = "start"
                if len(parts) >= 3 and parts[1] == "show" and parts[2] == "4" and re.match(r"\d\d:\d\d:\d\d:\d\d\d", parts[0]):
                    if  "cards" not in parts and "high" not in parts and "low" not in parts and "zoom" not in parts:
                        start = parts[0]
                        state = "show4"
                if len(parts) >= 3 and parts[1] == "show" and parts[2] == "3" and re.match(r"\d\d:\d\d:\d\d:\d\d\d", parts[0]):
                    if  "cards" not in parts and "high" not in parts and "low" not in parts and "zoom" not in parts:
                        start = parts[0]
                        state = "show3"
        
        if len(shows4):
            max = shows4[0]
            for s in shows4:
                if s[1] - s[0] > max[1] - max[0]:
                    max = s
            previewShow[fn.replace(".js", "")] = max
        elif len(shows3):
            max = shows3[0]
            for s in shows3:
                if s[1] - s[0] > max[1] - max[0]:
                    max = s
            previewShow[fn.replace(".js", "")] = max
        else:
            print (f"ERROR {fn} has no show")


with open("test-index.html", "w") as out:
    with open("index.html") as f:
        for line in f:
            line = line.rstrip()
            m = re.match(r'(.*id: ")([^"]+)(", name: "[^"]+", description: "[^"]+", age: "[^"]+", height: "[^"]+", weight: "[^"]+", cup: "[^"]+", preview: "[^"]+")(.*)(}.*)', line)
            if m:
                if m.group(2) in previewShow:
                    line = f'{m.group(1)}{m.group(2)}{m.group(3)}, start: "{previewShow[m.group(2)][0]}", end: "{previewShow[m.group(2)][1]}"{m.group(5)}' 
            print(line, file=out)
bp = 1
