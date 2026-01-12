## skpoker - a single user video strip poker game

You play poker against 1-4 primitive computer-controlled opponents. Trust me - in strip poker, you don't want clever opponents.

In each round, a player receives 5 cards and can call, fold or bet until one player calls or all others fold. If you run out of money, you have to take off an item of clothing.

## Installing the program

Skpoker is a webapp that runs entirely in your browser and does not require a web server. Simply download it and open index.html in your browser. Of course, you can also copy the game to your private web server.

For each opponent, you need a video and a file with the scene descriptions of the individual clips.

The game comes with scene descriptions for 100 opponents and a rudimentary tool for additional opponents. You can see the list of the included opponents in the hd directory. And as soon as you open index.html.

Check out https://f95zone.to/threads/virtual-strip-virtual-poker-games.4450 for tips on how to download and decode the videos.

Web browsers are very picky when it comes to video formats. AVI files don't work at all. With MP4 format, on some browsers sound doesn't work. 

First, try downloading a vs4 file, which will result in an mp4 file. If the mp4 does not work, or if you get an avi file - after converting them with ffmpeg using the default settings, they seem to work on every browser. (“-c:v copy” saves a lot of time).

ffmpeg -i downloads/tori.avi -c:v copy hd/tori.mp4

ffmpeg -i downloads/tori.mp4 -c:v copy hd/tori.mp4

Move your tori.mp4 file into the hd folder, next to tory.js.

## Music

Skpoker comes with background music and one track for the striptease show. If you don't like the music, simply replace the mp3 files in the audio directory with your own mp3s.

You can play different striptease music for each opponent. Place an mp3 with the opponent's number as the filename in the audio directory.

e.g. audio/4168.mp3 for 4186-victoria.vs4, or audio/4001.mp3 for tori.vs4

Using the Linux console, you can download all striptease tracks to your hard drive with wget.

for i in $(seq 4002 4396) ; do wget https://us2.torquemada-games.com/pobieralniawww/online/$i/$i.mp3; done

## Cheating

If you want to peek at your opponent's cards, just click on them.

Of course, in the source code you can further reduce the rudimentary AI of your opponents.

## Preview images

The preview images are loaded from the Internet. But if you don't want to wait every time, index.html can also load the images from your computer. Simply download all images into the preview directory.

With the Linux console, for example, you can download all previews at once.

for i in $(seq 4001 4396) ; do wget https://strippokerhd.com/galeria/$i/rank.jpg -O $i.jpg ; done

## Smartphones

Skpoker is supposed to run on any modern web browser, including smartphones. However, on phones, the browser is not allowed to launch webapps from its own file system. But it works with a private web server.

If you're running your web server on your Android phone, the free Simple HTTP Server is more than sufficient.

I've been told, there are tools to turn html pages into apps. If you figure out how to do that, please let us know.

## Timestamp Editor

The editor is not really production ready. No error handling, no documentation, and adapted to my own approach.

First, edit index.html. For all old opponents, you will find commented-out JavaScript lines. Remove the comment and enter a group number. 

Then you need python and ffmpeg on your PC. Run python edit.py. This is a rudimentary web server that performs tasks that are not possible with a web browser.

Then select your new opponent in your web browser and click on “Edit Timestamp.”

The basic idea is – use the space bar to play the video. It will stop at the next scene cut. This is usually also the end of the clip, and all you have to do is click on the button with the most appropriate classification.

The videos are quite confusing at first. And the only documentation on how skpoker uses the clips is the source code. But after a while, your hands will know where to click, and it will take you about an hour to create the cut marks.
