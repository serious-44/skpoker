In this directory, play.html searches for audios.

Skpoker comes with background music and one track for the striptease show. If you don't like the music, simply replace the mp3 files in the audio directory with your own mp3s.

You can play different striptease music for each opponent. Place an mp3 with the opponent's number as the filename in the audio directory.

e.g. audio/4168.mp3 for 4186-victoria.vs4

Using the Linux console, you can download all striptease tracks to your hard drive using wget.

for i in $(seq 4002 4395) ; do wget https://us2.torquemada-games.com/pobieralniawww/online/$i/$i.mp3; done

(Browsers refuse to play music directly from http://us2.torquemada-games.com, claiming it poses a critical risk to privacy. Do you know of a way to bypass these paranoid security settings?)


The background music is by TokyoRifft

https://pixabay.com/users/1797/

and Surprising_Media

https://pixabay.com/users/surprising_media-11873433/

Ths sondeffects by freesound_community

https://pixabay.com/users/freesound_community-46691455/