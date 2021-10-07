from moviepy.editor import VideoFileClip
from moviepy.editor import AudioFileClip
from moviepy.editor import CompositeVideoClip
from moviepy.editor import CompositeAudioClip
from moviepy.editor import concatenate_videoclips
from moviepy.editor import concatenate_audioclips
from moviepy.video.fx.resize import resize

import json
import os
import shutil

video_clips_to_concat = []
audio_clips_to_concat = []

video_clips_json_path = os.path.join("public", "temp", "videoClips.json")
audio_clips_json_path = os.path.join("public", "temp", "audioClips.json")

concatenated_video = None
concatenated_audio = None

video_size = (1920, 1080)

# create the concatenated video
if (os.path.exists(video_clips_json_path)):
    video_clips_json_file = open(video_clips_json_path)
    data = json.load(video_clips_json_file)

    for d in data:
        video_clip = VideoFileClip(os.path.join("public", "videos", d["filename"]))
        video_clip = video_clip.subclip(d["from"], d["to"]).set_position(("center", "center"))
        video_clip = resize(video_clip, video_size)
        video_clips_to_concat.append(video_clip)

    if (len(video_clips_to_concat)) > 0:
        concatenated_video = concatenate_videoclips(video_clips_to_concat, method="compose").set_position(("center", "center"))
    video_clips_json_file.close()

# create the concatenated audio
if (os.path.exists(audio_clips_json_path)):
    audio_clips_json_file = open(audio_clips_json_path)
    data = json.load(audio_clips_json_file)

    for d in data:
        audio_clip = AudioFileClip(os.path.join("public", "audio", d["filename"]))
        audio_clip = audio_clip.subclip(d["from"], d["to"])
        audio_clips_to_concat.append(audio_clip)

    if (len(audio_clips_to_concat) > 0):
        concatenated_audio = concatenate_audioclips(audio_clips_to_concat)

    audio_clips_json_file.close()

if (concatenated_video != None):
    video_created = False
    temp_dir_path = os.path.join("public", "temp")
    ready_to_stream_file_path = os.path.join(temp_dir_path, "readyToStream.mp4")
    if (concatenated_audio != None):
        final_video = CompositeVideoClip([concatenated_video], size=video_size)
        final_audio = concatenated_audio

        if (final_video.audio != None):
            final_audio = CompositeAudioClip([final_audio.audio, concatenated_audio])

        final_video.audio = final_audio
        final_video.write_videofile(ready_to_stream_file_path, audio_codec="aac")
        video_created = True
    else:
        final_video = CompositeVideoClip([concatenated_video], size=video_size)
        final_video.write_videofile(ready_to_stream_file_path, audio_codec="aac")
        video_created = True

    if (video_created):
        VIDSOURCE = ready_to_stream_file_path
        AUDIO_OPTS = "-c:a aac -b:a 160000 -ac 2"
        VIDEO_OPTS = "-s {}x{} -c:v libx264 -b:v 800000".format(video_size[0], video_size[1])
        OUTPUT_HLS = "-hls_time 10 -hls_list_size 10 -start_number 1"
        stream_output_path = os.path.join("public", "stream", "stream.m3u8")

        os.system("ffmpeg -i {} -y {} {} {} {}".format(VIDSOURCE, AUDIO_OPTS, VIDEO_OPTS, OUTPUT_HLS, stream_output_path))

        # remove everything in the temp folder
        for f in os.listdir(temp_dir_path):
            filename = f
            file_path = os.path.join(temp_dir_path, filename)
            if (os.path.isfile(file_path)):
                os.unlink(file_path)
