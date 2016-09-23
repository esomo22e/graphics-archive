#!/bin/bash

# SET VARIABLES
FOLDER='assets'
COUNT=`ls -l $FOLDER/orig/*.jpg | wc -l`

# CONVERT FRAMES TO A FILMSTRIP
montage -border 0 -geometry 1000x -tile $COUNT'x' -quality 60% $FOLDER'/orig/*.jpg' $FOLDER'/filmstrip-1000.jpg'
montage -border 0 -geometry 600x -tile $COUNT'x' -quality 50% $FOLDER'/orig/*.jpg' $FOLDER'/filmstrip-600.jpg'
montage -border 0 -geometry 375x -tile $COUNT'x' -quality 50% $FOLDER'/orig/*.jpg' $FOLDER'/filmstrip-375.jpg'

# CONVERT FRAMES TO GIF
# Note: To change the animation speed, tweak the first number in the "delay" value. Lower = faster.
# (Default of 30x60 means each frame displays for 1/2 second. 60x60 == one second.)
convert -background white -alpha remove -layers optimize-plus -delay 2x60 -resize 600 $FOLDER'/orig/*.jpg' -loop 0 $FOLDER'/filmstrip.gif'
