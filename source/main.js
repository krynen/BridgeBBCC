/* 기본 설정 */
configDefault = {
  numChatMax        : 20,               // html에 한꺼번에 표시될 수 있는 메세지의 최대 갯수
  personalColor     : false,            /* 이름 색깔을 트위치 이름색과 일치시킬지
                                           theme에서 제한 가능                        */
  badgeVisible      : false,            /* 구독, 비트 등 뱃지를 표시할지
                                           theme에서 제한 가능                        */
  badgeChannelId    : 0,                // 구독 뱃지를 불러올 채널ID
  themeURI          : "",               /* 불러올 테마 Uri.
                                           로컬 테마를 이용할 경우 공백으로 둔다.     */
  theme             : "default",        // 사용할 테마. theme\테마\*의 파일을 사용
  themeName         : "",               /* 테마의 이름
                                           theme로부터 import                         */
  msgExistDuration  : 0,                // 메세지가 애니메이션을 빼면 얼마나 오래 표시될 지
  msgAniDuration    : 0,                /* 메세지 표시 애니메이션의 소요시간
                                           theme로부터 import                         */
  debugLevel        : 2,                // 0:미표시, 1:console.log, 2:addChatMessage
  useDisplayName    : true,             // 한글 닉네임으로 이름을 표시할지
  loadCheerImgs     : true,             // 비트 후원채팅을 이미지로 표시할지
  loadTwitchCons    : true,             // 트위치 이모티콘과 구독콘을 불러올지
  loadTwitchv2      : true,             // 움직이는 트위치 이모티콘을 불러올지
  loadDcCons        : true,             // 디씨콘을 불러올지
  dcConsURI         : "",               /* 불러올 디씨콘 Uri.
                                           로컬 디씨콘을 이용할 경우 공백으로 둔다.   */
  subMonthsMsg      : "☆ {!0:{months} 개월 }구독{0: 시작}! ☆",
                                        // 구독 메세지를 받았을 때 추가로 출력할 텍스트
  cheersMsg         : "☆ {!0:{bits} 비트 }후원 ! ☆",
                                        // 비트 후원을 받았을 때 추가로 출력할 텍스트
  clipReplaceMsg    : "[클립]",         // 클립 링크의 대체 텍스트
  linkReplaceMsg    : "[링크]",         // (일반) 링크의 대체 텍스트
  webSocket         : "wss://irc-ws.chat.twitch.tv:443",
                                        /* 접속할 웹소켓
                                           const value                                */
  nick              : "justinfan00000", // 트위치 IRC에서 이용할 gust nickname
  pass              : "foobar",         // 트위치 IRC에서 이용할 guest password
  channel           : "#mr_watert",     /* 접속할 채널
                                           "#id1,#id2,.."으로 여러 채널에 접속 가능   */
  retryInterval     : 3,                // 접속에 끊겼을 때 재접속 시도 간격(초)
  allMessageHandle  : false,            /* IRC로부터 받은 처리되지 않은 메세지를 html에 표시
                                           "처리되지 않은 메세지를 수신했습니다"      */
  muteUser          : ["Nightbot"],     /* html에 표시하지 않을 유저 nickname
                                           display-name과 트위치 id를 모두 사용 가능  */
  deleteBanMsg      : true,             // ban된 유저의 메세지를 지우기
  commands          : [
    {exe:"clear", msg:"!!clear"},
    {exe:"theme", msg:"!!theme"},
    {exe:"load", msg:"!!load"},
    {exe:"scale", msg:"!!scale"}
  ],                                    // 활성화시킬 명령어
  replaceMsgs       : []                /* 봇 메세지 등을 대체
                                           {
                                             orig: 원문(문자열 또는 정규표현식),
                                             to: 대체할 문자열("{no_display}"로 미표시)
                                            }                                         */
};



/* 메세지 출력 함수 정의 */
var numChat = 0;
var replaceMsgFormat = function(message, amount) {
  if (typeof amount != "number") { amount = 0; }

  var retMessage = message.replace("{months}", amount).replace("{bits}", amount);
  if (amount == 0) {
    retMessage = retMessage.replace(/\{0:([^\}]*)}/g, "$1").replace(/\{!0:([^\}]*)}/g, "");
  }
  else {
    retMessage = retMessage.replace(/\{!0:([^\}]*)}/g, "$1").replace(/\{0:([^\}]*)}/g, "");
  }
  return retMessage;
}
var getRemoveTimeout = function(box) {
  return function() {
    if ((box||{}).parentElement != null) {
      box.remove();
      --numChat;
    }
  };
}
var timeToMs = function(time) {
  var num = time.split(/[a-z]/i)[0];
  try { num = Number(num); }
  catch(e) { return 0; }

  var isMs = /ms/.test(time);
  return num * (isMs? 1: 1000);
}
var applyMessageRemove = function(box) {
  // 기존 타이머를 정리
  if (box.timeout) { clearTimeout(box.timeout); }
  if (!box.nodeType) { return; }

  // CSS 애니메이션 적용
  if (configData.msgAniDuration) {
    var computedStyle = getComputedStyle(box);
    var origName = computedStyle.animationName;
    var origDuration = computedStyle.animationDuration;
    var origAnimation = computedStyle.animation;
    var origDirection = computedStyle.animationDirection;

    box.classList.add("remove");
    var newName = computedStyle.animationName;
    var newDuration = computedStyle.animationDuration;

    var condOrig = (origName != "none");
    var condNew = (newName != "none");
    var condSame = (origName == newName);

    if (!condNew && !condOrig) {
    // 애니메이션이 하나도 없을 경우 그냥 삭제
      (getRemoveTimeout(box))();
      return;
    }

    if (condOrig && (condNew == condSame)) {
    // 메세지 삭제 애니메이션만 없을 경우 생성 애니메이션을 반전
      box.style.animation = origAnimation;
      box.style.animationDirection = {
        "normal": "reverse", "alternate": "alternate-reverse",
        "reverse": "normal", "alternate-reverse": "alternate"
      }[origDirection] || "reverse";
    }

    if (configData.msgAniDuration > 0) {
    // 애니메이션 시간을 적용
      newDuration = configData.msgAniDuration + "s";
      box.style.animationDuration = newDuration;
    }


    box.timeout = setTimeout(
      getRemoveTimeout(box),
      timeToMs(newDuration) || timeToMs(origDuration)
    );
  } else {
  // 메세지 삭제 애니메이션 무시
    (getRemoveTimeout(box))();
    return;
  }
}
addChatMessage = function(nick, message, data) {

  // DOM Element 생성
  var chatNicknameBox = document.createElement("div");
  chatNicknameBox.classList.add("chat_nickname_box");
  var chatBadgeBox = document.createElement("div");
  chatBadgeBox.classList.add("chat_badge_box");
  var chatUpperBox = document.createElement("div");
  chatUpperBox.classList.add("chat_upper_box");
  var chatMessageBox = document.createElement("div");
  chatMessageBox.classList.add("chat_msg_box");
  var chatLowerBox = document.createElement("div");
  chatLowerBox.classList.add("chat_lower_box");
  var chatOuterBox = document.createElement("div");
  chatOuterBox.classList.add("chat_outer_box");
  if (data.nick) { chatOuterBox.classList.add("user_"+data.nick); }


  // Element에 내용 추가
  chatNicknameBox.innerHTML = nick;
  message = message.replace(/\\\"/g, '"').replace(/\\\\/g, "\\");
  if (typeof applyMessage != "undefined") {
    chatMessageBox.innerHTML = applyMessage(message, data);
    if (data.noDisplay) { return null; }
  }
  else { chatMessageBox.innerHTML = message; }

  if (data) {
    if (data.color && configData.personalColor) {
      chatNicknameBox.style.color = data.color;
    }

    if (data.badges && configData.badgeVisible) {
    // 뱃지 채워넣고
      data.badges.toString().split(",").forEach( function(badge) {
        var badgeName = badge.split("/")[0];
        var badgeTier = badge.split("/")[1];

        var targets = Object.keys(badgeList||{})
          .filter( function(name) { return (name.indexOf(badgeName + "/") == 0); } )
          .filter( function(name) {
            if (!isNaN(badgeTier)) { return Number(name.split("/")[1]) <= badgeTier; }
            return (name.indexOf(badgeTier) == badgeName.length+1);
          } )
          .sort( function(right, left) {
            return Number(left.split("/")[1]) - Number(right.split("/")[1]);
          } );

        if (targets.length > 0) {
          var chatBadge = document.createElement("img");
          chatBadge.src = badgeList[targets[0]];
          chatBadge.classList.add("badge_" + badgeName);
          chatBadge.classList.add("badge_" + badge);
          chatBadgeBox.appendChild(chatBadge);
        }
      } );
    }
    if (chatBadgeBox.children.length == 0) { chatBadgeBox.classList.add("empty"); }

    if (data.clip) {
    // 클립 추가하고
      chatLowerBox.innerHTML = data.clip + chatLowerBox.innerHTML;
    }
    if (data.subMonths != undefined) {
    // 후원메세지 그 위에 추가하고
      chatLowerBox.innerHTML =
        '<div class="chat_subscribe_box">' +
        replaceMsgFormat(configData.subMonthsMsg, data.subMonths) +
        "</div>" + chatLowerBox.innerHTML;
    }
    if (data.cheers != undefined) {
    // 비트 메세지도 그 위에 추가하고
      chatLowerBox.innerHTML =
        '<div class="chat_cheer_box">' +
        replaceMsgFormat(configData.cheersMsg, data.cheers) +
        "</div>" + chatLowerBox.innerHTML;
    }
  }
  if ( chatMessageBox.innerHTML.replace(/(<[^>]*>)|\s/g,"").length == 0) {
    chatMessageBox.classList.add("image_only");
  }


  // 페이지에 Element 연결
  chatUpperBox.appendChild(chatNicknameBox);
  chatUpperBox.appendChild(chatBadgeBox);
  chatOuterBox.appendChild(chatUpperBox);
  chatOuterBox.upper = chatUpperBox;
  chatOuterBox.appendChild(chatLowerBox);
  chatOuterBox.lower = chatLowerBox;
  chatLowerBox.appendChild(chatMessageBox);
  chatLowerBox.msg = chatMessageBox;
  document.getElementById("chat_wrapper").appendChild(chatOuterBox);


  // 메세지 타임아웃 설정
  if (configData.msgExistDuration > 0) {
    setTimeout(
      function() { applyMessageRemove(chatOuterBox); },
      configData.msgExistDuration*1000
    );
  }

  // 넘치는 메세지를 삭제
  if((++numChat > configData.numChatMax)) {
    var first = document.getElementsByClassName("chat_outer_box")[0];
    document.getElementById("chat_wrapper").removeChild(first);
    --numChat;
  }

  return chatOuterBox;
}

var concatChatMessage = function(nick, message, data) {
  var lChild = document.getElementById("chat_wrapper").lastChild;
  if (lChild && lChild.getElementsByClassName("chat_nickname_box")[0].innerHTML == nick) {
    if (typeof applyMessage != "undefined") { message = applyMessage(message, data); }
    with (lChild.lower.msg) {
      innerHTML += "\n" + message;
      style.maxHeight = "none";
      style.whiteSpace = "pre-line";
      style.lineHeight = "1.5";
    }
  }
  else { addChatMessage.apply(this, arguments); }
}

var banChatMessage = function(nick) {
  var children = document.getElementsByClassName("user_"+nick);
  if (children && children.length > 0) {
    for (var index in children) {
      if (isNaN(Number(index))) { continue; }
      children[index].lower.msg.innerHTML =
        "&lt;message deleted&gt;";
    }
  }
}

var applyReplace = function(message, data){ return message; };
var applyCheerIcon = function(message, data){ return message; };
var applyTwitchCon = function(message, data){ return message; };
var applyDcCon = function(message, data){ return message; };
var applyMessage = function(message, data) {
  // 색채팅 제거
  if ( (message.indexOf("ACTION")==6) && (message.indexOf("\\u0001")!=-1) ) {
    message = message.replace(/\\u0001/g, "").replace(/^ACTION /, "");
  }

  // HTML 이스케이핑
  if ((data.escape == undefined) || (data.escape == true)) {
    message = message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  message = applyReplace(message, data);
  message = applyTwitchCon(message, data);
  message = applyCheerIcon(message, data);
  message = applyDcCon(message, data);

  var twipApply = require("./twip_apply.js");
  if (twipApply) { message = twipApply.apply(message, data); }
  return message;
}

/* URL에서 설정값을 가져와 덮어쓰기 */
if (window.location.href.indexOf("?") != -1) {
  var queries = window.location.search;
  if (queries||"".length > 0) {
    queries.slice(1).split("&").forEach( function(queryData) {
      var value = queryData.split("=");
      var key = value.shift();
      value = value[0];

      if (value == undefined) { return; }

      if (key == "scale") {
        if (!isNaN(value)) { window.localStorage.setItem("scale", value); }
      }
      else if (configDefault.hasOwnProperty(key)) {
        switch (key) {
          case "channel":
            configData.channel = value.split(",").map( function(channel) {
              return "#" + channel;
            } ).join(",");
            return;

          case "muteUser":
            configData.muteUser = (value==="")? []: value.split(",");
            return;

          case "webSocket":
          case "nick":
          case "pass":
            return;

          default:
            break;
        }

        switch (typeof(configDefault[key])) {
          case "object":
            return;

          case "boolean":
            configData[key] = (value === "true");
            return;

          case "number":
            var numberValue = Number(value);
            if (!isNaN(numberValue)) { configData[key] = numberValue; }
            return;

          case "string":
          default:
            break;
        }

        configData[key] = value;
      }
    } );
  }
}



/* 배율 설정 적용 */
var setScale = function() {
  var scale = window.localStorage.getItem("scale");
  if (!scale) { return; }

  with (document.body.style) {
    width = (10000 / scale) + "%";
    transformOrigin = "left bottom";
    transform = "scale(" + scale/100 + ")";
  }
}
setScale();



/* 설정 파일 확인 및 디버그 내용 출력 함수 정의 */
var completeCount = 0;
var checkComplete = function() {
  /* CSS, 디씨콘, 뱃지, 이모티콘+구독콘, 후원아이콘, 설정, 그리고 접속채널들 */
  var num = 6 + configData.channel.match(/#/g).length;
  if (++completeCount == num) {
    var width = Number(getComputedStyle(document.body).width.slice(0,-2));
    width = Math.max(12, parseInt(width/20))+"px";
    var chat = addChatMessage("",
      '<center style="line-height:1em; box-sizing:border-box;">' +

      '<div style="display:inline-block; font-size:' + width + ";" +
                  'padding:0.45em; background:black">' +

      '<div style="padding:0.45em; border:0.1em solid white; ' +
                  "display:inline-block !important; white-space:pre !important;" +
                  "font-size:" + width + "; line-height:1em; color:white !important;" +
                  "font-family:'굴림체' !important; font-weight:normal; " +
                  'text-shadow:.05em .05em dodgerblue;">' +
        "   Ｂ ｒ ｉ ｄ ｇ ｅ    \n ■■□□     □□■■  \n" +
        " ■  □  □ □  ■      \n ■■□□   □  ■      \n" +
        " ■  □  □ □  ■      \n ■■□□□   □□■■。"   +
      "</div></div></center>",
      { badges:[], escape:false }
    )
    if (chat != null) {
      chat.upper.style.display = "none";
      chat.lower.msg.style.maxHeight = "none";
    }
    checkComplete = function(){};
  }
}
if (typeof configData == "undefined") { configData = {}; }
debugLog = function(dat) {};
{
  var configLoadMessage = "";
  var configDataLength = Object.keys(configData).length;

  if (configDataLength == 0) {
    configLoadMessage = "설정 파일(lib/config.js)을 로드하는 데 문제가 생겨 기본 설정을 사용합니다.<br />";
    Object.assign(configData, configDefault);
  }
  else {
    var unloadedConfigs = Object.keys(configDefault).reduce( function(acc, cur) {
      if (configData[cur] === undefined) {
        configData[cur] = JSON.parse(JSON.stringify(configDefault[cur]));
        return (++acc);
      }
      return acc;
    }, 0 );

    if (unloadedConfigs > 0) {
      configLoadMessage = "일부 설정값을 찾을 수 없어 기본값을 사용합니다.<br />";
    }
  }

  if (configData.debugLevel != 0) {
    if (configData.debugLevel == 1) { debugLog = function(dat) { console.log(dat); }; }
    else {
      debugLog = function(dat, unConcat) {
        if (unConcat) {
          addChatMessage("DEBUG", dat,
            { badges:["moderator/1"], color:"red", escape:false });
        }
        else {
          concatChatMessage("DEBUG", dat,
            { badges:["moderator/1"], color:"red", escape:false });
        }
      };
    }
  }

  debugLog(configLoadMessage + "설정을 불러왔습니다.");
  checkComplete();
}



/* 지정 메세지 대체 */
if ((configData.replaceMsgs) && (configData.replaceMsgs.length>0)) {
  applyReplace = function(message, data) {
    for(var index in configData.replaceMsgs) {
      var msg = configData.replaceMsgs[index];
      if ( (!msg.nick) || (msg.nick == data.nick) ) {
        if ((msg.to=="{no_display}") && (message.match(msg.orig)!=null)) {
          data.noDisplay = true;
          return message;
        }

        message = message.replace(msg.orig, msg.to);
      }
    }
    return message;
  };
}


/* CSS 로드 */
var loadCss = function(isRetrying) {
  // 재 로드를 위해 기존 css를 제거
  var existings = document.getElementsByClassName("chat_theme");
  for(var index=0; index<existings.length; ++index) {
    existings[index].remove();
  }

  document.head.appendChild( function() {
    if (configData.themeURI == "") { configData.themeURI = "./theme/"; }
    else if (configData.themeURI[configData.themeURI.length-1] != "/") {
      configData.themeURI += "/";
    }

    var ret = document.createElement("link");
    ret.onload = function() {
        debugLog(configData.themeName + " 테마를 적용했습니다.");
        checkComplete();
    };
    ret.onerror = function() {
        debugLog("테마 적용에 실패했습니다.");
        if (isRetrying != true) {
          debugLog("기본 설정으로 테마 설정을 재시도합니다.");
          configData.theme = configDefault.theme;
          loadCss(true);
        }
    };

    ret.rel = "stylesheet";
    ret.href = configData.themeURI + configData.theme + "/theme.css";
    ret.classList.add("chat_theme");

    return ret;
  }() );
};
loadCss();



/* 뱃지 정보 로드 */
var badgeList = {};
if (configData.badgeVisible) {
  var globalBadgeRequest = new window.XMLHttpRequest();
  globalBadgeRequest.open(
    "GET",
    "https://badges.twitch.tv/v1/badges/global/display",
    true
  );

  var handler = function(response) {
    var data = JSON.parse(response)["badge_sets"];

    Object.keys(data).forEach( function(name) {
      var tiers = data[name].versions||{};
      Object.keys(tiers).forEach( function(tier) {
        badgeList[name + "/" + tier] = tiers[tier]["image_url_1x"];
      } );
    } );
  };

  globalBadgeRequest.onreadystatechange = function(evt) {
    if (globalBadgeRequest.readyState == 4) {
      if (globalBadgeRequest.status == 200) {
        handler(globalBadgeRequest.responseText);

        if (configData.badgeChannelId && Number(configData.badgeChannelId)>0) {
          var channelBadgeUrl = "https://badges.twitch.tv/v1/badges/channels/";
          channelBadgeUrl += configData.badgeChannelId + "/display";

          var channelBadgeRequest = new window.XMLHttpRequest();
          channelBadgeRequest.open("GET", channelBadgeUrl, true);

          channelBadgeRequest.onreadystatechange = function(evt) {
            if (channelBadgeRequest.readyState == 4) {
              if (channelBadgeRequest.status == 200) {
                handler(channelBadgeRequest.responseText);

                debugLog("뱃지 정보를 모두 불러왔습니다.");
              }
              else {
                debugLog(
                  "스트리머 고유 뱃지를 불러오는 데 실패했습니다." +
                  "\n에러 코드 " + channelBadgeRequest.status);
              }

              checkComplete();
            }
          }

          channelBadgeRequest.send(null);
        }
        else {
          debugLog("뱃지 정보를 불러왔습니다.");
          checkComplete();
        }
      }
      else {
        debugLog(
          "뱃지 정보를 불러오는 데 실패했습니다." +
          "\n에러 코드 " + globalBadgeRequest.status);
      }
    }
  };

  globalBadgeRequest.send(null);
}



/* 비트 후원 메시지 아이콘으로 변경*/
var cheerList = require("./cheer_list.json");
var cheerRegExp = new RegExp("(\\s|^)(" + cheerList.join("|") + ")(\\d+)(\\s|$)", "i");
if (configData.loadCheerImgs) {
  applyCheerIcon = function(message, data) {
    if ((!data.cheers) && (data.cheers=="")) { return message; }

    var matches = message;
    var newMessage = "";

    while ((matches) && (matches.match(cheerRegExp) != null)) {
      var match = matches.match(cheerRegExp);

      var remain = matches.split(match[0]);
      newMessage += remain.shift();

      matches = match[4] + remain.join(match[0]);
      var value = match[3]>=100? (
        match[3]>=1000? (
          match[3]>=5000? (
            match[3]>=10000? (
              match[3]==100000? 100000: 10000): 5000
          ): 1000
        ): 100
      ): 1;
      newMessage +=
        match[1] +
        '<div class="chat_cheer_text"><img class="cheer_icon" src="./images/cheer/' +
        match[2] + value +
        '.gif"/>' + match[3] + "</div> ";
    }

    return newMessage + (matches? matches: "");
  };

  debugLog("후원 아이콘을 불러왔습니다.");
  checkComplete();
}
else {
  debugLog("설정에 의해 후원 아이콘을 불러오지 않았습니다.");
  checkComplete();
}



/* 디씨콘 및 구독콘 로드 및 적용 */
if (configData.loadTwitchCons) {
  var twitchConsUrlTemplate = "https://static-cdn.jtvnw.net/emoticons/v2/";

  applyTwitchCon = function(message, data) {
    if ( !(data && data.emotes) || (data.emotes.length==0) ) { return message; }

    // 받은 emotes 데이터를 가공
    var emotes = {};
    data.emotes.split("/").forEach( function(emote) {
      var emoteDataArray = emote.split(/[:,-]/g);
      var emoteId = emoteDataArray[0];
      var from = Number(emoteDataArray[1]);
      var to = Number(emoteDataArray[2]);
      emotes[data.message.slice(from, to+1)] = emoteId;
    } );

    // 가공된 데이터를 이용해 메세지를 변조
    Object.keys(emotes)
      .sort( function(a,b) { return b.length - a.length; } )
      .forEach( function(emote) {
        var emoteRegExp = new RegExp(
          "( |^)(" + emote
            .replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/\(/g, "\\(").replace(/\)/g, "\\)") +
          ")(\\s|$)"
        );
        var emoteElement =
          '<img class="twitch_emote" src="' +
          twitchConsUrlTemplate +
          emotes[emote] +
          (configData.loadTwitchv2? "/default": "/static") +
          '/dark/3.0" />';

        while (message.match(emoteRegExp)) {
          message = message.replace(emoteRegExp, "$1" + emoteElement + "$3");
        }
      } );
    return message;
  };

  debugLog("트위치 이모티콘과 구독콘을 적용했습니다.");
  checkComplete();
}
else {
  debugLog("설정에 따라 트위치 이모티콘과 구독콘을 불러오지 않았습니다.");
  checkComplete();
}

dcConsData = [];
var loadDcCon = function() {};
if (configData.loadDcCons) {
  loadDcCon = function() {
    var dcConsSubURI = "images/";
    var dcConsMainURI = "";
    if (configData.dcConsURI == "" || configData.dcConsURI == "./") {
      configData.dcConsURI = "./";
      dcConsSubURI = "images/dccon/";
      dcConsMainURI = "lib/";
    }
    else if (configData.dcConsURI[configData.dcConsURI.length-1] != "/") {
      configData.dcConsURI += "/";
    }

    var dcConScript = document.createElement("script");
    dcConScript.type = "text/javascript";
    dcConScript.charset = "utf-8";
    dcConScript.src = configData.dcConsURI + dcConsMainURI + "dccon_list.js?ts=" + new Date().getTime();
    document.body.appendChild(dcConScript);

    dcConScript.onload = function() {
      if (dcConsData.length == 0) { debugLog("디씨콘을 불러오는 데 실패했습니다."); }
      else {
        var keywords = [];
        for (var index in dcConsData) {
          for (var index2 in dcConsData[index].keywords) {
            keywords.push(dcConsData[index].keywords[index2]);
          }
        }
        keywords.sort(function(a,b) { return b.length - a.length; } );

        applyDcCon = function(message, data) {
          for (var index in keywords) {
            var keyword = keywords[index];
            if (message.indexOf("~" + keyword) != -1) {
              message = message.split("~" + keyword).join(
                '<img class="dccon" src="' +
                configData.dcConsURI + dcConsSubURI +
                dcConsData.find( function(element) {
                  return element.keywords.indexOf(keyword) != -1;
                } ).name +
                '" />');
            }
          }

          return message;
        };
        debugLog("디씨콘을 적용했습니다.");
        checkComplete();
      }
    };
  };
  loadDcCon();
}
else {
  debugLog("설정에 따라 디씨콘을 적용하지 않았습니다.");
  checkComplete();
}



/* 명령어 정의 */
var commandExecute = function(exe, arg) {
  switch (exe) {
  case "clear" :
    manageMessage("@ : CLEARCHAT #\n");
    return true;

  case "theme" :
    arg = arg.match(/[a-zA-Z0-9_-]+/)[0];
    if (arg != null) {
      configData.theme = arg.toLowerCase();
      loadCss();
      return true;
    }
    else {
      debugLog("잘못된 테마가 입력되었습니다.");
      return false;
    }

  case "load" :
    if (arg == "" || arg == "디씨콘" || arg == "디시콘" || arg == "dccon") {
      loadDcCon();
      return true;
    }
    break;

  case "scale":
    if (arg == "") {
      debugLog("현재 배율 : " + (window.localStorage.getItem("scale")||100) + "%");
      return true;
    }
    if (!isNaN(arg)) {
      window.localStorage.setItem("scale", Number(arg));
      setScale();
      return true;
    }
    break;

  default:
    break;
  }
  debugLog("잘못된 명령어입니다.");
  return false;
}



/* IRC 클라이언트 설정 */
var joinCount = 0;
defaultColors = [
  "#FF0000", "#0000FF", "#00FF00", "#B22222", "#FF7F50",
  "#9ACD32", "#FF4500", "#2E8B57", "#DAA520", "#D2691E",
  "#5F9EA0", "#1E90FF", "#FF69B4", "#8A2BE2", "#00FF7F"];
debugLog("트위치에 접속을 시도합니다.");
manageMessage = function() {}; // 받은 명령어 처리 함수
var client = function() {
  ws = new WebSocket(configData.webSocket);

  ws.onopen = function() {
    ws.send("PASS " + configData.pass + "\r\n");
    ws.send("NICK " + configData.nick + "\r\n");
    ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership' + "\r\n");
    ws.send("JOIN " + configData.channel + "\r\n");
  }
  var onmessageEventHandler = function(evt) {
    var lines = evt.data.toString().split(/\r\n|\r|\n/);
    lines.pop();
    lines.forEach( function(element) {
      var line = JSON.stringify(element).slice(1,-1);
      var args = line.replace(/^(:|@)/m, "").split(" ");

      if (line[0] == ":") {
      // IRC 명령어 처리
        switch (args[1]) {
        case "421":   // 잘못된 명령어를 보냈을 때
        case "001":   // 웰컴 메세지
        case "002":   // 호스트 알림
        case "003":   // 서버 상태태
        case "004":   // 접속초기메세지 끝
        case "375":   // MOTD(공지사항) 시작
        case "372":   // MOTD
        case "376":   // MOTD 끝
        case "CAP":   // 트위치 명령어 수신 확인 메세지
        case "353":   // 접속자 목록(로드가 안된상태라 justinfan뿐이지만)
        case "366":   // 이름 목록 끝
        case "MODE":  // 관리자 권한 감지
        case "PART":  // 서버에서 유저 접속 해제
        case "HOSTTARGET":
                      // 호스팅에 변화가 생겼을 때
          break;

        case "JOIN":  // 서버에 유저가 접속
          if(args[0].search("justinfan") != -1) {
            debugLog(
              args[2].substring(1) + "에 접속했습니다.");
          }
          if(++joinCount <= configData.channel.match(/#/g).length) {
            checkComplete();
          }
          break;

        default:      // 미처리 메세지
          if (configData.allMessageHandle) {
            debugLog("처리되지 않은 메세지를 수신했습니다.<br />" + line);
          }
          break;
        }
      }
      else if (line[0] == "@") {
      // 트위치 명령어 처리
        var data = {};
        var twitchArgs = {};
        args.shift().split(";").forEach( function(element) {
          var keyval = element.split("=");
          twitchArgs[keyval[0]] = keyval[1];
        } );

        switch(args[1]) {
        case "ROOMSTATE":   // 방 정보
          break;



        case "USERNOTICE":
          switch(twitchArgs["msg-id"]) {
            case "sub":
            case "resub":   // 구독 메세지 수신
              data.subMonths = Number(twitchArgs["msg-param-cumulative-months"]);
              break;

            case "subgift":
            case "anonsubgift":
            case "submysterygift":

            case "rewardgift":
            case "anongiftpaidupgrade":

            case "raid":
            case "unraid":

            case "ritual":
            case "bitsbadgetier":

            default:
              if (configData.allMessageHandle) {
                debugLog("처리되지 않은 메세지를 수신했습니다.<br />" + line);
              }
              break;
          }
          break;

        case "PRIVMSG":     // 채팅 수신
          // 이름 지정
          var nick = args[0].split(/[!@]/g)[1];
          nick = (nick==undefined? twitchArgs.login: nick);
          var displayNick = twitchArgs["display-name"];
          var realNick = "";
          if ( (configData.useDisplayName) && (displayNick.replace(/\s/g, "")!="") ) {
            realNick = displayNick;
          }
          else { realNick = nick; }

          var message = args.slice(3).join(" ").substring(1);
          data.message = message;
          data.badges = twitchArgs.badges;
          data.color = twitchArgs.color;
          data.emotes = twitchArgs.emotes;
          data.nick = nick;

          // muteUser 적용
          if (configData.muteUser) {
            var match = configData.muteUser.find( function(element) {
              return (element == displayNick) || (element == nick);
            } );

            if (match != undefined) break;
          }

          // 명령어 파싱
          if (configData.commands.length > 0) {
            if (data.badges.toString().search("broadcaster") != -1) {
              var isBreak = false;
              for(var index in configData.commands) {
                var cmd = configData.commands[index];
                if (message.search(cmd.msg) == 0) {
                  var cmdText = cmd.exe;
                  var cmdArgument = message.split(cmd.msg + " ");
                  cmdArgument.shift();
                  cmdArgument = cmdArgument.join(cmd.msg + " ");

                  isBreak = isBreak || commandExecute(cmdText, cmdArgument);
                }
              }

              if (isBreak) break;
            }
          }

          // 링크 파싱
          var linkRegExp = /^(https?:\/\/)?([A-Za-z0-9#%\-_=+]+\.)+[a-z]{2,}(\/[0-9A-Za-z#%&()+/\-\.:=?@_~]*)?/;
          message.split(/\s/).forEach( function(phrase) {
            if (phrase.match(linkRegExp)) {
              if (
                ((configData.clipReplaceMsg||"").length>0) &&
                (phrase.indexOf("twitch")>=0) && (phrase.indexOf("clip")>=0)
              ) {
                message = message.replace(phrase, configData.clipReplaceMsg);
              }
              else if ((configData.linkReplaceMsg||"").length>0) {
                message = message.replace(phrase, configData.linkReplaceMsg);
              }
            }
          } );

          // 유저 이름색 지정
          if (!data.color || data.color=="") {
            var n = realNick.charCodeAt(0) + realNick.charCodeAt(1)*new Date().getDate();
            data.color = defaultColors[n % defaultColors.length];
          }

          // 비트 메세지 파싱
          if (twitchArgs.bits) { data.cheers = Number(twitchArgs.bits); }

          // 메세지 출력
          addChatMessage(realNick, message, data);
          break;

        case "NOTICE":      // 공지 메세지
          switch(twitchArgs["msg-id"]) {
          case "host_off":  // 호스팅을 끊었을 때
          case "host_target_went_offline":
                            // 호스팅이 끊겼을 때
            debugLog("호스팅이 종료되었습니다.");
            break;

          case "host_on":   // 호스팅되었을 때
            debugLog(
              args[5].slice(0,-1) + " 호스팅 중.\n" +
              "호스팅중인 채팅의 전송은 지원하지 않습니다.");
            break;

          }
          break;

        case "CLEARCHAT": // 매니저가 /clear 했을 때
          if(args.length == 4) {
            banChatMessage(args[3].substring(1));
          }
          else {
            document.getElementById("chat_wrapper").innerHTML = "";
            numChat = 0;
          }
          break;

        default:            // 미처리 메세지
          if (configData.allMessageHandle) {
            debugLog("처리되지 않은 메세지를 수신했습니다.<br />" + line);
          }
          break;
        }
      }
      else {
        // 서버 연결상태 확인용 ping-pong
        if (args[0] == "PING") { ws.send("PONG :tmi.witch.tv\r\n"); }
        else if (configData.allMessageHandle) {
          debugLog("처리되지 않은 메세지를 수신했습니다.<br />" + line);
        }
      }
    } );
  }
  ws.onmessage = onmessageEventHandler;
  manageMessage = function(string) {
    var evt = {};
    evt.data = string;
    onmessageEventHandler(evt);
  };

  ws.onclose = function() {
    debugLog(
      "채팅 서버와의 연결이 종료되었습니다.<br />" +
      configData.retryInterval + "초 후 재접속을 시도합니다.");
      setTimeout(
        function() { client(); },
        configData.retryInterval * 1000 );
  }
};
client();
