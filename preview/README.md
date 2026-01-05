## Directory for preview images

In this directory, index.html searches for preview images with the names 4001.png, 4002.png, 4003.png... 

For downloading, I used wget in a Linux terminal.

for i in $(seq 4001 4394) ; do wget https://strippokerhd.com/galeria/$i/rank.jpg -O $i.jpg ; done
