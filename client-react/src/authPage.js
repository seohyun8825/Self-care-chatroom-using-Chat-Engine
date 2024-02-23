import React,{ useState, useEffect } from "react";
import axios from "axios";
import './authPage.css';

const AuthPage = (props) => {
  const [chat_user_id, setChatUserId] = useState();
  const [chat_user_name, setChatUserName] = useState();
  const [username, setUsername] = useState();
  const [secret, setSecret] = useState();
  const [email, setEmail] = useState();
  const [first_name, setFirstName] = useState();
  const [last_name, setLastName] = useState();
  const [authorization, setAuthorization] = useState();
  const time_to_show_login = 400;
  const time_to_hidden_login = 200;
  const time_to_show_sign_up = 100;
  const time_to_hidden_sign_up = 400;
  const time_to_hidden_all = 500;
  const [store_response_signup, setResponse]  = useState();
  const onLogin = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:3001/login", { username, secret })
        .then((response)=> {
          if (response.data['code']==400) {
            alert("Failed to Login\n\nUse correct ID, PWD");
            document.getElementById('login_username').value="";
            document.getElementById('login_password').value="";
            document.getElementById('login_username').focus();
          }
          else {
            console.log(response.data);
            props.onAuth({ ...response.data, secret })
          }
        })
      .catch((e) => console.log(JSON.stringify(e.response.data)));
  };
  const onSignup = (e) => {
    e.preventDefault();
    if (secret!=document.getElementById("signup_confirm").value){
      alert("Wrote different password for confirming\nBe sure to write the same password for confirmaiton!\n");
      document.getElementById("signup_password").value="";
      document.getElementById("signup_confirm").value="";
      document.getElementById("signup_password").focus();
    } else {
        axios
        .post("http://localhost:3001/signup", {
          username,
          secret,
          email,
          first_name,
          last_name,
          authorization
        })
        .then((response) => {
          if (response.data['code']==400) {
            alert("Wrong Authorization Code\nPlease Re-Write it\n\n" +
                "If you are failing continuosly failing, Re-Sent the Code")
            document.getElementById('mail_authorize').value=''
            document.getElementById('mail_authorize').focus()
          } else {
            setChatUserId(response.data['id'])
            setChatUserName(response.data['username'])
            setResponse(response.data)
            openModal()
          }
        })// NOTE: over-ride secret
        .catch((e) => console.log(JSON.stringify(e.response.data)));
    };
  }
  function allowOnlyEnglish_username(event) {
    var inputValue = event.target.value;
    var pattern = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~|/\\-\\s\\b]+$/;
    if (!pattern.test(inputValue)) {
      alert("You can writeDown only Engilsh for userName!\n" +
          "Blanks are not allowed!\n" +
          "We are very sorry about your convenience.😢");
      event.target.value = "";
    }
  };
  function allowOnlyEnglish_lastname(event) {
    var inputValue = event.target.value;
    var pattern = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~|/\\-\\s\\b]+$/;
    if (!pattern.test(inputValue)) {
      alert("You can writeDown only Engilsh for lastName!\n" +
          "Blanks are not allowed!\n" +
          "We are very sorry about your convenience.😢");
      event.target.value = "";
    }
  };
  function allowOnlyEnglish_firstname(event) {
    var inputValue = event.target.value;
    var pattern = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~|/\\-\\s\\b]+$/;
    if (!pattern.test(inputValue)) {
      alert("You can writeDown only Engilsh for firstName!\n" +
          "Blanks are not allowed!\n" +
          "We are very sorry about your convenience.😢");
      event.target.value = "";
    }
  };
  function allowOnlyEnglish_email(event) {
    var inputValue = event.target.value;
    var pattern = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~|/\\-\\s\\b]+$/;
    if (!pattern.test(inputValue)) {
      alert("You can writeDown only Engilsh, Numbers, and symbols for emailAddress!\n" +
          "Blanks are not allowed!\n" +
          "We are very sorry about your convenience.😢");
      event.target.value = "";
    }
  };
  function change_to_login() {
    document.querySelector(".cont_forms").className =
      "cont_forms cont_forms_active_login";
    document.querySelector(".cont_form_login").style.display = "block";
    document.querySelector(".cont_form_sign_up").style.opacity = "0";

    setTimeout(function () {
      document.querySelector(".cont_form_login").style.opacity = "1";
    }, time_to_show_login);

    setTimeout(function () {
      document.querySelector(".cont_form_sign_up").style.display = "none";
    }, time_to_hidden_login);
  }
  function change_to_sign_up(at) {
    document.querySelector(".cont_forms").className =
      "cont_forms cont_forms_active_sign_up";
    document.querySelector(".cont_form_sign_up").style.display = "block";
    document.querySelector(".cont_form_login").style.opacity = "0";

    setTimeout(function () {
      document.querySelector(".cont_form_sign_up").style.opacity = "1";
    }, time_to_show_sign_up);

    setTimeout(function () {
      document.querySelector(".cont_form_login").style.display = "none";
    }, time_to_hidden_sign_up);
  }
  function hidden_login_and_sign_up() {
    document.querySelector(".cont_forms").className = "cont_forms";
    document.querySelector(".cont_form_sign_up").style.opacity = "0";
    document.querySelector(".cont_form_login").style.opacity = "0";

    setTimeout(function () {
      document.querySelector(".cont_form_sign_up").style.display = "none";
      document.querySelector(".cont_form_login").style.display = "none";
    }, time_to_hidden_all);
  }
  const sendCode = (e) => {
    const hiddenInput = document.getElementById('mail_authorize');
    if (hiddenInput) {
      if (hiddenInput.style.display = 'None') {
        e.preventDefault();
        axios
          .post("http://localhost:3001/authorization", {email})
          .then((response) => {
            if (response.data['code'] == 200) {
              alert("Authorization Code sent to your Email!");
              hiddenInput.style.display = 'inline';
              hiddenInput.focus();
            } else {
              alert("Failed to send Authorization code to your Email");
              document.getElementsByName('email').value='';
              document.getElementsByName('email').focus();
            }
          })
          .catch((e) => console.log(JSON.stringify(e.response.data)));
      }
      else {
        axios
          .post("http://localhost:3001/authorization", {email})
          .then((response) => {
            if (response.data['code'] == 200) {
              alert("Authorization Code sent to your Email!");
              hiddenInput.focus();
            } else {
              alert("Failed to send Authorization code to your Email");
              document.getElementsByName('email').value='';
              document.getElementsByName('email').focus();
            }
          })
          .catch((e) => console.log(JSON.stringify(e.response.data)));
      }
    }
  }
  function openModal() {
        var modal = document.getElementById("myModal");
        modal.style.display = "flex";
    }
  function closeModal() {
      var modal = document.getElementById("myModal");
      modal.style.display = "none";
  }
  function handleFormSubmit() {
      // 각 입력 필드의 값을 가져오기
      var birth = document.getElementById("dateOfBirth").value;
      var sex = document.getElementById("sex").value;
      var test = document.getElementById("test").value;
      var period = document.getElementById("period").value;
      var place_live = document.getElementById("placeLive").value;
      var place_study = document.getElementById("placeStudy").value;
      var video_theme = document.getElementById("videoTheme").value;
      var transmission_time = document.getElementById("transmissionTime").value;
      axios
      .post("http://localhost:3001/user/insert", {
          chat_user_id, chat_user_name,
          birth, sex, test, period, place_live, place_study, video_theme, transmission_time
      })
        .then((response)=> {
          if (response.data['code']==400) {
            alert("Failed to complete signUp.\n\nPlease Retry!");
            document.getElementById("dateOfBirth").value='';
            document.getElementById("sex").value='';
            document.getElementById("test").value='';
            document.getElementById("period").value='';
            document.getElementById("placeLive").value='';
            document.getElementById("placeStudy").value='';
            document.getElementById("videoTheme").value='';
            document.getElementById("transmissionTime").value='';
            document.getElementById('dateOfBirth').focus();
          }
          else {
            alert("SignUp Completed!!")
            closeModal();
            props.onAuth({ ...store_response_signup, secret })
          }
        })
      .catch((e) => console.log(JSON.stringify(e.response.data)));
  }
  return (
      <div className="cotn_principal">
        <style>
          {`
            * {
              text-align: center;
              margin: 0px auto;
              padding: 0px;
              font-family: "Open Sans", sans-serif;
            }
            /* 모달 스타일 */
            .modal {
                display: none;
                position: fixed;
                text-align: center;
                align-items: center;
                justify-content: center;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                box-sizing: border-box;
                font-family: "Open Sans", sans-serif;
                font-weight: bold;
            }
    
            .modal-content {
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                width: 80%; /* 최대 너비 설정 */
                max-width: 400px; /* 최대 너비 설정 */
                transform: scale(0.9);
            }
    
            /* 닫기 버튼 스타일 */
            .close {
                color: #aaa;
                float: right;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
            }
    
            /* 입력 필드 스타일 */
            .modal-content label, .modal-content select {
                display: block;
                margin-bottom: 10px;
            }
    
            .modal-content input, .modal-content select {
                width: 100%;
                padding: 8px;
                box-sizing: border-box;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
    
            .modal-content button {
                background-color: #4caf50;
                color: #fff;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
    
            .modal-content button:hover {
                background-color: #45a049;
            }
          `}
        </style>
        {/*모달 폼*/}
        <div id="myModal" className="modal">
            <div className="modal-content">
                <span className="close" onClick="closeModal()">&times;</span>

                <label htmlFor="dateOfBirth">생년월일</label>
                <input type="date" id="dateOfBirth"/>

                <label htmlFor="sex">성별</label>
                <select id="sex">
                    <option value="남자">남자</option>
                    <option value="여자">여자</option>
                </select>

                <label htmlFor="test">시험분야</label>
                <select id="test">
                    <option value="CPA">CPA</option>
                    <option value="로스쿨">로스쿨</option>
                    <option value="행정고시">행정고시</option>
                </select>

                <label htmlFor="period">공부기간</label>
                <select id="period">
                    <option value="1년 이하">1년 이하</option>
                    <option value="1년 이상 2년 이하">1년 이상 2년 이하</option>
                    <option value="2년 이상 3년 이하">2년 이상 3년 이하</option>
                    <option value="3년 이상">3년 이상</option>
                </select>

                <label htmlFor="placeLive">사는 곳</label>
                <input type="text" id="placeLive" placeholder="e.g., 서울시 도봉구"/>

                <label htmlFor="placeStudy">공부하는 곳</label>
                <select id="placeStudy">
                    <option value="학교">학교</option>
                    <option value="동네">동네</option>
                </select>

                <label htmlFor="videoTheme">선호 영상 테마</label>
                <select id="videoTheme">
                    <option value="음악 - 플레이리스트">음악 - 플레이리스트</option>
                    <option value="명상 - 스트레칭">명상 - 스트레칭</option>
                    <option value="자극 - 동기부여">자극 - 동기부여</option>
                </select>

                <label htmlFor="transmissionTime">영상 전송 선호 시간대</label>
                <input type="time" id="transmissionTime"/>

                <button onClick={handleFormSubmit}>회원가입 완료</button>
            </div>
        </div>

            <div className="cont_centrar">

          <div className="cont_login">
            <div className="cont_info_log_sign_up">
              <div className="col_md_login">
                <div className="cont_ba_opcitiy">
                  <h2>LOGIN</h2>
                  <p><strong>Use the Username ad PWD<br/>You used in your signUp!</strong></p>
                  <button className="btn_login" onClick={change_to_login}>LOGIN</button>
                </div>
              </div>
              <div className="col_md_sign_up">
                <div className="cont_ba_opcitiy">
                  <h2>SIGN UP</h2>
                  <p><strong>All the activites are anonymous.<br/>Write down your nickname</strong></p>
                  <button className="btn_sign_up" onClick={change_to_sign_up}>SIGN UP</button>
                </div>
              </div>
            </div>

            <div className="cont_back_info">
              <div className="cont_img_back_grey">
                <img src="https://images.unsplash.com/42/U7Fc1sy5SCUDIu4tlJY3_NY_by_PhilippHenzler_philmotion.de.jpg?ixlib=rb-0.3.5&q=50&fm=jpg&crop=entropy&s=7686972873678f32efaf2cd79671673d" alt="" />
              </div>

            </div>
            <div className="cont_forms">
              <div className="cont_img_back_">
                <img src="https://images.unsplash.com/42/U7Fc1sy5SCUDIu4tlJY3_NY_by_PhilippHenzler_philmotion.de.jpg?ixlib=rb-0.3.5&q=50&fm=jpg&crop=entropy&s=7686972873678f32efaf2cd79671673d" alt="" />
              </div>

              <form onSubmit={onLogin}>
                <div className="cont_form_login">
                  <a href="#" onClick={hidden_login_and_sign_up}><i className="material-icons">&#xE5C4;</i></a>
                  <h2>LOGIN</h2>
                  <input id="login_username" type="text" name="username"
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                  />
                  <input id="login_password" type="password" name="secret"
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Password"
                  />
                  <button className="btn_login" onClick={change_to_login}>LOGIN</button>
                </div>
              </form>

              <form onSubmit={onSignup}>
                <div className="cont_form_sign_up">
                  <a href="#" onClick={hidden_login_and_sign_up}><i className="material-icons">&#xE5C4;</i></a>
                  <h2>SIGN UP</h2>
                  <input type="text" name="username" placeholder="Username"
                   onInput={allowOnlyEnglish_username}
                   onChange={(e) => setUsername(e.target.value)}
                  />
                  <input id="signup_password" type="password" name="secret" placeholder="Password"
                    onChange={(e) => setSecret(e.target.value)}
                  />
                  <input id="signup_confirm" type="password" name="confirm" placeholder="Confirm Password" />
                  <input type="text" name="email" placeholder="Email"
                    onInput={allowOnlyEnglish_email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button id="mail_authorize_btn" style={{ backgroundColor: 'limegreen', width: "auto" }} type="button" className="btn_login" onClick={sendCode}>이메일로 인증코드 발송</button>
                  <input id="mail_authorize" type="text" placeholder="Write down code sent to your email" style={{ display: 'none' }}
                    onChange={(e) => setAuthorization(e.target.value)}
                  />
                  <input type="text" name="first_name" placeholder="Firstname"
                    onInput={allowOnlyEnglish_firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input type="text" name="last_name" placeholder="Lastname"
                    onInput={allowOnlyEnglish_lastname}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <button className="btn_sign_up" onClick={change_to_sign_up}>SIGN UP</button>
                </div>
              </form>

            </div>

          </div>
        </div>
      </div>
  );
};

export default AuthPage;