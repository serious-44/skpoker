## skpoker - a single user video strip poker game

You play poker against 1-4 primitive computer-controlled opponents. Trust me - in strip poker, you don't want clever opponents.

In each round, a player receives 5 cards and can call, fold or bet until one player calls or all others fold. If you run out of money, you have to take off an item of clothing.

## Installing the program

Skpoker is a webapp that runs entirely in your browser and does not require a web server. Simply download it and open index.html in your browser. Of course, you can also copy the game to your private web server.

For each opponent, you need a video and a file with the timestamps of the individual clips.

The game comes with timestamps for 100 opponents and a rudimentary tool for additional opponents. For a list of the included opponents, open index.html in your browser.

Check out https://f95zone.to/threads/virtual-strip-virtual-poker-games.4450 for tips on how to download and decode the videos.

Try to download mp4 files, but you can also convert avi files with ffmpeg.

ffmpeg -i tori.avi -c:v copy tori.mp4

Move your tori.mp4 file into the hd folder, next to tory.js.

## Cheating

If you want to peek at your opponent's cards, just click on them.

Of course, in the source code you can further reduce the rudimentary AI of your opponents.

## Preview images

The preview images are loaded from the Internet. However, if available, index.html loads the images from your computer. Simply download all images into the preview directory.

I used wget in a Linux terminal.

for i in $(seq 4001 4395) ; do wget https://strippokerhd.com/galeria/$i/rank.jpg -O $i.jpg ; done

## Smartphones

Skpoker is supposed to run on any modern web browser, including smartphones. However, on phones, the browser is not allowed to launch webapps from its own file system. But it works with a private web server.

I've been told, there are tools to turn html pages into apps. If you figure out how to do that, please let us know.

## Timestamp Editor

The editor is not really production ready. No error handling, no documentation, and adapted to my own approach.

First, edit index.html. For all old opponents, you will find commented-out JavaScript lines. Remove the comment and enter a group number. 

Then you need python and ffmpeg on your PC. Run python edit.py. This is a rudimentary web server that performs tasks that are not possible with a web browser.

Then select your new opponent in your web browser and click on “Edit Timestamp.”

The basic idea is – use the space bar to play the video. It will stop at the next scene cut. This is usually also the end of the clip, and all you have to do is click on the button with the most appropriate classification.

The videos are quite confusing at first. And the only documentation on how skpoker uses the clips is the source code. But over time, your hands will know where to click.
