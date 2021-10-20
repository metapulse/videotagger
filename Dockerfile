FROM node:14 as front_end

WORKDIR /front_end

COPY ./client ./

RUN npm install

RUN npm run build

FROM node:slim as back_end

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server ./

RUN mkdir build

COPY --from=front_end /front_end/build ./build

ENV PORT=8080

EXPOSE 8080

RUN apt-get update || : && apt-get install python3 -y && apt-get install python3-pip -y

RUN apt-get install -y ffmpeg

RUN pip3 install moviepy

CMD ["npm", "start"]