FROM node:14

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server .

ENV PORT=8080

EXPOSE 8080

RUN apt-get update || : && apt-get install python3 -y && apt-get install python3-pip -y

RUN apt-get install -y ffmpeg

RUN pip3 install --upgrade setuptools

RUN pip3 install moviepy

VOLUME /server/public/videos

CMD ["npm", "start"]