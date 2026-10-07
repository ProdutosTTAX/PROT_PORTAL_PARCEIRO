#!/bin/bash
set -euo pipefail

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
sudo systemctl enable --now nginx
sudo mkdir -p /var/www/portal-parceiro
sudo tar -xzf "$HOME/portalproduto.tar.gz" -C /var/www/portal-parceiro
sudo chown -R www-data:www-data /var/www/portal-parceiro
sudo cp "$HOME/nginx-portal.conf" /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl restart nginx
curl -fsI http://127.0.0.1 | head -n 1
