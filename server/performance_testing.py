import json
import os
import time

video_clips_json_path = os.path.join("public", "temp", "videoClips.json")

with open("performance_testing_input.json", "r") as config_file:
    config = json.load(config_file)
    video_quality = config.get("video_quality")
    number_subclips = config.get("number_subclips")

    os.chdir(os.path.abspath(os.path.dirname(__file__)))

    with open(video_clips_json_path, "w") as videoClipsJson:
        # set up videoClips.json to include the number of subclips needed
        data = []
        number_subclips = int(number_subclips)

        for i in range(0, number_subclips):
            data.append({"filename": "video_1.mp4", "from": "0", "to": "5"})
        
        json.dump(data, videoClipsJson)
    videoClipsJson.close()

    start_time = time.time()
    os.system('python {} -resolution {}'.format("main.py", video_quality))
    end_time = time.time()

    total_time_taken_seconds = end_time - start_time
    
    with open("performance_log.txt", "a") as performance_log:
        log = "\ntest run on: {} \nnumber of subclips: {} \nvideo resolution: {} \ntime taken (seconds): {}\n".format(time.ctime(start_time), number_subclips, video_quality, total_time_taken_seconds)
        performance_log.write(log)

    performance_log.close()
config_file.close()
