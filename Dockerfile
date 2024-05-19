FROM phusion/baseimage:noble-1.0.0
MAINTAINER Anatoly Bubenkov "bubenkoff@gmail.com"

ENV HOME /root

# enable ssh
RUN rm -f /etc/service/sshd/down

# Regenerate SSH host keys. baseimage-docker does not contain any, so you
# have to do that yourself. You may also comment out this instruction; the
# init system will auto-generate one during boot.
RUN /etc/my_init.d/00_regen_ssh_host_keys.sh

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

RUN apt-get update

RUN apt-get install -y openssh-server wget lsb-release sudo gnupg2 git build-essential libbz2-dev libreadline-dev libsqlite3-dev libcurl4-gnutls-dev libzip-dev libssl-dev libxml2-dev libxslt1-dev php8.3-cli php8.3-bz2 php8.3-xml pkg-config imagemagick libmagickwand-dev ffmpeg poppler-utils libonig-dev 

EXPOSE 22
EXPOSE 3011
EXPOSE 4011

RUN mkdir -p /var/run/sshd
RUN chmod 0755 /var/run/sshd

# Configure SSH access
RUN mkdir -p /home/ubuntu/.ssh
RUN echo "ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA6NF8iallvQVp22WDkTkyrtvp9eWW6A8YVr+kz4TjGYe7gHzIw+niNltGEFHzD8+v1I2YJ6oXevct1YeS0o9HZyN1Q9qgCgzUFtdOKLv6IedplqoPkcmF0aYet2PkEDo3MlTBckFXPITAMzF8dJSIFo9D8HfdOV0IAdx4O7PtixWKn5y2hMNG0zQPyUecp4pzC6kivAIhyfHilFR61RGL+GPXQ2MWZWFYbAGjyiYJnAmCP3NOTd0jMZEnDkbUvxhMmBYSdETk1rRgm+R4LOzFUGaHqHDLKLX+FIPKcF96hrucXzcWyLbIbEgE98OHlnVYCzRdK8jlqm8tehUc9c9WhQ== ubuntu insecure public key" > /home/ubuntu/.ssh/authorized_keys
RUN chown -R ubuntu: /home/ubuntu/.ssh
RUN echo -n 'ubuntu:ubuntu' | chpasswd

# Enable passwordless sudo for the "ubuntu" user
RUN mkdir -p /etc/sudoers.d
RUN install -b -m 0440 /dev/null /etc/sudoers.d/ubuntu
RUN echo 'ubuntu ALL=NOPASSWD: ALL' >> /etc/sudoers.d/ubuntu

# Install nvm, node & yarn
RUN su ubuntu -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
    && source /home/ubuntu/.nvm/nvm.sh \
    && nvm install lts/iron \
    && nvm alias default lts/iron \
    && nvm use default \
    && npm install --global yarn"

# Install rvm & ruby
RUN echo 'gem: --no-document' > /home/ubuntu/.gemrc
RUN su ubuntu -c "gpg --keyserver hkp://keyserver.ubuntu.com --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB"
RUN su ubuntu -c "curl -sSL https://get.rvm.io | bash -s stable"
RUN su ubuntu -c "source /home/ubuntu/.rvm/scripts/rvm && rvm pkg install openssl"
RUN su ubuntu -c "source /home/ubuntu/.rvm/scripts/rvm && rvm install ruby-3.0.4 --with-openssl-dir=/home/ubuntu/.rvm/usr"

# Install phpbrew & php
#RUN su ubuntu -c "cd /home/ubuntu && curl -L -O https://github.com/phpbrew/phpbrew/releases/latest/download/phpbrew.phar \
#    && chmod +x phpbrew.phar \
#    && sudo mv phpbrew.phar /usr/local/bin/phpbrew \
#    && phpbrew init \
#    && [[ -e ~/.phpbrew/bashrc ]] && source ~/.phpbrew/bashrc \
#    && phpbrew update \
#    && cd /home/ubuntu && wget https://www.openssl.org/source/openssl-1.1.1i.tar.gz && tar -xzf /home/ubuntu/openssl-1.1.1i.tar.gz && cd openssl-1.1.1i && ./Configure --prefix=/home/ubuntu/openssl-1.1.1i/bin -fPIC -shared linux-x86_64 && make -j 8 && make install \
#    && export PKG_CONFIG_PATH=/home/ubuntu/openssl-1.1.1i/bin/lib/pkgconfig && phpbrew install 8.3 \
#    && phpbrew switch 8.3"

# Install postgresql
RUN apt-get install -y postgresql postgresql-contrib libpq-dev
RUN /etc/init.d/postgresql start && su postgres -c "psql -c \"CREATE USER ubuntu WITH PASSWORD 'ubuntu' SUPERUSER;\""
RUN /etc/init.d/postgresql start && su postgres -c "psql -c \"CREATE DATABASE demo_7_1_storage_tier;\""

# Install mongodb
RUN mkdir -p /data/db
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
RUN echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
RUN apt-get update
RUN apt-get install -y mongodb-org

