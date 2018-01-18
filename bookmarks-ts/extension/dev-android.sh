#!/bin/sh

DEVICE_LINE=`adb devices | sed -n 2p`
for D in $DEVICE_LINE; do
  web-ext run --target=firefox-android --adb-device=$D
  break
done

