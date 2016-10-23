#!/bin/sh

echo "Installing nvm..."
curl https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash
source ~/.profile

echo "Installing node version..."
nvm install 6
nvm alias default 6
