from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from dotenv import load_dotenv
from flask_cors import CORS
import os, requests
import random, string, threading
import schedule
import time
import pytz
from datetime import datetime


app = Flask(__name__)
CORS(app)
load_dotenv()
auth_codes=set({})

# DB configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DB_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
class User(db.Model):
    __tablename__ = 'user'
    chat_user_id = db.Column(db.Integer, primary_key=True)
    chat_user_name = db.Column(db.String(20), unique=True, nullable=False)
    birth = db.Column(db.Date, nullable=False)
    sex = db.Column(db.String(5), nullable=False)
    test = db.Column(db.String(10), nullable=False)
    period = db.Column(db.String(20), nullable=False)
    place_live = db.Column(db.String(20), nullable=False)
    place_study = db.Column(db.String(5), nullable=False)
    video_theme = db.Column(db.String(20), nullable=False)
    transmission_time = db.Column(db.Time, nullable=False)
class DailyInfo(db.Model):
    __tablename__ = 'daily_info'
    chat_user_name = db.Column(db.String(20), db.ForeignKey('user.chat_user_name'), primary_key=True)
    day = db.Column(db.Date, primary_key=True)
    sleep_hour = db.Column(db.Integer)
    sleep_minute = db.Column(db.Integer)
    sleep_quality = db.Column(db.Integer)
    study_hour = db.Column(db.Integer)
    study_minute = db.Column(db.Integer)
    stress = db.Column(db.Integer)

# Mail server configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT']=587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_DEFAULT_SENDER'] = 'sonjt5744@gmail.com'
app.config['MAIL_USERNAME'] = 'sonjt5744@gmail.com'
app.config['MAIL_PASSWORD'] = os.getenv("FLASK_MAIL")
mail=Mail(app)

def get_youtube_link(video_theme):
    youtube_links = {
        "음악 - 플레이리스트": "https://youtube.com/playlist?list=YOUR_MUSIC_PLAYLIST_LINK",
        "명상 - 스트레칭": "https://youtube.com/playlist?list=YOUR_MEDITATION_STRETCHING_LINK",
        "자극 - 동기부여": "https://youtube.com/playlist?list=YOUR_MOTIVATION_LINK"
    }
    return youtube_links.get(video_theme, "Default YouTube Link")


def convert_city_name(city_name):
    if city_name.startswith("서울시"):
        return "Seoul"
    
    #도시별로 다 변환해야하지만.. 일단은 서울시만
    return city_name



def create_weather_message(city_name, weather_description, temp):
    base_message = f"{city_name}의 날씨는 {weather_description}이며, 온도는 {temp}도로"

    if "맑음" in weather_description:
        return f"{base_message} 상쾌한 하루가 될 것 같습니다. 좋은 하루 보내세요!"
    elif "구름" in weather_description:
        return f"{base_message} 쾌청하지만 약간은 흐릴 수 있습니다. 기분 좋은 하루 되세요!"
    elif "비" in weather_description:
        return f"{base_message} 비가 오니 우산을 챙기시는 것이 좋겠습니다. 비에 젖지 않게 조심하세요!"
    elif "눈" in weather_description:
        return f"{base_message} 눈이 내리니 따뜻하게 입고 나가세요. 눈길 조심하세요!"
    else:
        return f"{base_message}입니다. 하루를 준비하시면서 날씨도 확인해 보세요!"

def get_weather_info(city_name):
    converted_city_name = convert_city_name(city_name)  # 도시 이름 변환
    weather_api_key = os.getenv("OPENWEATHER_API_KEY")  
    url = f"http://api.openweathermap.org/data/2.5/weather?q={converted_city_name}&appid={weather_api_key}&units=metric&lang=kr"
    
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        main_weather = data['weather'][0]['description']
        temp = data['main']['temp']
        return create_weather_message(city_name, main_weather, temp)
    else:
        return "날씨 정보를 가져오는데 실패했습니다."
    

def add_user_to_chat(chat_id, user_name):
    try:
        response = requests.post(
            f'https://api.chatengine.io/chats/{chat_id}/people/',
            headers={
                "Project-ID": os.environ['CHAT_ENGINE_PROJECT_ID'],
                "User-Name": "admin",
                "User-Secret": "0000",
                "PRIVATE-KEY": os.environ['CHAT_ENGINE_PRIVATE_KEY']
            },
            json={"username": user_name}
        )
        if response.ok:
            print(f"User {user_name} added to chat {chat_id}")
        else:
            print(f"Error adding user {user_name} to chat {chat_id}: {response.text}")
    except Exception as e:
        print(f"Error in add_user_to_chat: {str(e)}")

def get_or_create_chat_room(user_name):
    try:
        print("Received user_name:", user_name)
        response = requests.put(
            'https://api.chatengine.io/chats/',
            headers={
                "Project-ID": os.environ['CHAT_ENGINE_PROJECT_ID'],
                "User-Name": "admin",
                "User-Secret": "0000",
                "PRIVATE-KEY": os.environ['CHAT_ENGINE_PRIVATE_KEY']
            },
            json={
                "usernames": [user_name],
                "is_direct_chat": True
            }
        )

        if response.ok:
            chat = response.json()
            print(f"Chat room for user {user_name} is {chat['id']}")
            return chat['id']
        else:
            print(f"Error in chat room creation or retrieval for user {user_name}: {response.text}")
            return None
    except Exception as e:
        print(f"Error in get_or_create_chat_room with user_name '{user_name}': {str(e)}")
        return None

def send_custom_message_to_all_users(message):
    try:
        response = requests.get(
            'https://api.chatengine.io/users/',
            headers={"PRIVATE-KEY": os.environ['CHAT_ENGINE_PRIVATE_KEY']}
        )
        if response.ok:
            users = response.json()
            for user in users:
                if "username" in user:
                    chat_id = get_or_create_chat_room(user["username"])
                    if chat_id:
                        add_user_to_chat(chat_id, user["username"])
                        send_response = requests.post(
                            f'https://api.chatengine.io/chats/{chat_id}/messages/',
                            json={
                                "text": message,
                                "sender_username": "admin",
                                "sender_secret": "0000"
                            },
                            headers={
                                "Project-ID": os.environ['CHAT_ENGINE_PROJECT_ID'],
                                "User-Name": "admin",
                                "User-Secret": "0000",
                                "PRIVATE-KEY": os.environ['CHAT_ENGINE_PRIVATE_KEY']
                            }
                        )
                        if not send_response.ok:
                            print(f"Error sending message: {send_response.text}")
                else:
                    print("Username key not found in user:", user)
        else:
            print("Error fetching users:", response.text)
    except Exception as e:
        print(f"Error in send_custom_message_to_all_users: {str(e)}")

def get_kst_time():
    utc_now = pytz.utc.localize(datetime.utcnow())
    kst_now = utc_now.astimezone(pytz.timezone("Asia/Seoul"))
    return kst_now

def send_custom_message_to_user(user_name, message, video_link=None):
    chat_id = get_or_create_chat_room(user_name)
    if chat_id:
        add_user_to_chat(chat_id, user_name)
        if video_link:
            formatted_message = f"{message} <a href=\"{video_link}\">여기를 클릭하세요</a>"
        else:
            formatted_message = message
        send_response = requests.post(
            f'https://api.chatengine.io/chats/{chat_id}/messages/',
            json={
                "text": formatted_message,
                "sender_username": "admin",
                "sender_secret": "0000"
            },
            headers={
                "Project-ID": os.environ['CHAT_ENGINE_PROJECT_ID'],
                "User-Name": "admin",
                "User-Secret": "0000",
                "PRIVATE-KEY": os.environ['CHAT_ENGINE_PRIVATE_KEY']
            }
        )
        if not send_response.ok:
            print(f"Error sending message: {send_response.text}")



last_message_time = {} 

def scheduled_weather_job():
    users = User.query.all()
    for user in users:
        weather_message = get_weather_info(user.place_live)
        send_custom_message_to_user(user.chat_user_name, weather_message)
        print(f"Weather info sent to {user.chat_user_name}")



def scheduled_video_link_job():
    #print("Scheduled job running at", get_kst_time())
    current_time = get_kst_time().strftime("%H:%M")
    users = User.query.all()
    for user in users:
        user_time = user.transmission_time.strftime("%H:%M")
        print(f"Checking user {user.chat_user_name} with time {user_time}")
        if current_time == user_time and (user.chat_user_name not in last_message_time or last_message_time[user.chat_user_name] != current_time):
            video_link = get_youtube_video_link(user.video_theme)
            print(f"Sending video link to user {user.chat_user_name}")
            # 여기에서 메시지 부분을 수정합니다.
            send_custom_message_to_user(user.chat_user_name, "오늘의 비디오입니다:", video_link)
            last_message_time[user.chat_user_name] = current_time


schedule.every().minute.do(scheduled_video_link_job)  # 매 분마다 실행되는거

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")  
def get_youtube_video_link(search_query):
    search_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": search_query,
        "type": "video",
        "maxResults": 1,
        "key": YOUTUBE_API_KEY
    }

    response = requests.get(search_url, params=params)
    results = response.json()

    if "items" in results and results["items"]:
        video_id = results["items"][0]["id"]["videoId"]
        return f"https://www.youtube.com/watch?v={video_id}"
    else:
        return "No video found"



#메세지 입력
def scheduled_morning_job(message):
    send_custom_message_to_all_users(message)
    print("Morning message sent to all users at", get_kst_time())

def scheduled_lunch_job(message):
    send_custom_message_to_all_users(message)
    print("Lunch message sent to all users at", get_kst_time())

#아침 8시마다 닐씨 정보 전송, 
#사용자가 설정한 시간에 컨텐츠 전송
def run_schedule():
    with app.app_context():
        morning_message = ""
        lunch_message = ""
        morning_time = "09:59"
        lunch_time = "16:59"
        schedule.every().day.at("08:00").do(scheduled_weather_job)
        schedule.every().day.at(morning_time).do(scheduled_morning_job, morning_message)
        schedule.every().day.at(lunch_time).do(scheduled_lunch_job, lunch_message)
        schedule.every().minute.do(scheduled_video_link_job)  # 매 분마다 실행

        while True:
            now = get_kst_time().strftime("%H:%M")
            if now == morning_time:
                scheduled_morning_job(morning_message)
            if now == lunch_time:
                scheduled_lunch_job(lunch_message)
            schedule.run_pending()
            time.sleep(1)


thread = threading.Thread(target=run_schedule, daemon=True)
thread.start()

@app.route('/login', methods=['POST'])
def login():
    response = requests.get('https://api.chatengine.io/users/me/',
        headers={
            "Project-ID": os.environ['CHAT_ENGINE_PROJECT_ID'],
            "User-Name": request.get_json()['username'],
            "User-Secret": request.get_json()['secret']
        }
    )
    resp=response.json()
    if 'detail' in resp.keys():
        data={"message" : resp['detail'], "code":400}
        return jsonify(data)
    else:
        resp["code"]=200
        return resp

@app.route('/signup', methods=['POST'])
def signup():
    if request.get_json()['authorization'] in auth_codes:
        response = requests.post('https://api.chatengine.io/users/',
            data={
                "username": request.get_json()['username'],
                "secret": request.get_json()['secret'],
                "email": request.get_json()['email'],
                "first_name": request.get_json()['first_name'],
                "last_name": request.get_json()['last_name']
            },
            headers={ "PRIVATE-KEY": os.environ['CHAT_ENGINE_PRIVATE_KEY'] }
        )
        return response.json()
    else:
        data = {"message" : "Wrong Authorization Code", "code" : 400}
        return jsonify(data)

@app.route('/user/insert', methods=['POST'])
def userInsert():
    chat_user_id=request.get_json()['chat_user_id']
    chat_user_name=request.get_json()['chat_user_name']
    birth=request.get_json()['birth']
    sex=request.get_json()['sex']
    test=request.get_json()['test']
    period=request.get_json()['period']
    place_live=request.get_json()['place_live']
    place_study=request.get_json()['place_study']
    video_theme=request.get_json()['video_theme']
    transmission_time=request.get_json()['transmission_time']
    new_user = User(
        chat_user_id=int(chat_user_id),
        chat_user_name=chat_user_name,
        birth=birth,
        sex=sex,
        test=test,
        period=period,
        place_live=place_live,
        place_study=place_study,
        video_theme=video_theme,
        transmission_time=transmission_time
    )
    print(chat_user_id,    chat_user_name, birth, sex, test, period,place_live,place_study, video_theme, transmission_time)
    db.session.add(new_user)
    db.session.commit()
    selected_user = User.query.filter_by(chat_user_id=chat_user_id).first()
    print(selected_user)
    if selected_user :
        data = {"message": "SignUp completed", "code": 200}
    else :
        data = {"message": "SignUp Failed", "code": 400}
    return jsonify(data)

@app.route('/authorization', methods=['POST'])
def send_email():
    recipent=request.get_json()['email']
    subject = '[팀 ] 이메일 인증 코드 발송'
    body = generate_verification_code()
    message = Message(subject, recipients=[recipent], sender='sonjt5744@gmail.com')
    message.body = body
    try:
        mail.send(message)
        auth_codes.add(body)
        remove_key(body, 300)
        data = {"message": 'succeesfully sent', "code": 200}
        return jsonify(data)
    except Exception as e:
        data = {"message": 'Sending Failed', "code": 400}
        return jsonify(data)

def generate_verification_code(length=10):
    characters=string.ascii_letters + string.digits
    verification_code=''.join(random.choice(characters) for _ in range(length))
    return verification_code
def remove_key(key, delay):
    threading.Timer(delay, lambda: auth_codes.discard(key)).start()


# DB 연결 확인용 삽입 API (추후 삭제할 것)
@app.route('/api/user', methods=['GET'])
def create_user():
    userid = request.args.get('chat_user_id')
    username = request.args.get('chat_user_name')
    print(userid, username)
    new_user = User(
        chat_user_id=userid,
        chat_user_name=username,
        birth='1990-1-1',
        sex='Male',
        test='Test Value',
        period=7,
        place_live='City',
        place_study='동네',
        video_theme='Technology',
        transmission_time='12:00:00'
    )
    db.session.add(new_user)
    db.session.commit()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=3001)