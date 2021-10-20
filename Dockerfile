FROM node:14 as front_end

WORKDIR /front_end

COPY ./client ./

RUN npm install

RUN npm run build

FROM python:3.7-alpine3.14 as back_end

WORKDIR /app

RUN apk add --update npm

COPY ./server/package*.json ./

RUN npm install

COPY ./server ./

RUN mkdir build

COPY --from=front_end /front_end/build ./build

ENV PORT=8080

EXPOSE 9090

EXPOSE 8080

RUN apk add  --no-cache ffmpeg

RUN apk update 

RUN pip install --upgrade pip setuptools wheel

RUN apk add make automake gcc g++ subversion zlib-dev jpeg-dev

ENV LIBRARY_PATH=/lib:/usr/lib

RUN pip3 install moviepy

CMD ["npm", "start"]