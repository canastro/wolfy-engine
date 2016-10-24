#!/bin/sh

echo "Installing node version..."
curl -sL https://deb.nodesource.com/setup_6.x | -E bash -
apt-get install -y nodejs

echo "Install pm2..."
npm i -g pm2
cp processes.json /etc/pm2/conf.d/
