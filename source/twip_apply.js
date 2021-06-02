var twipMsg =
  configData&&configData.twipCheersMsg?
  configData.twipCheersMsg:
  configData.cheersMsg;

exports.apply = function(message, data) {
  if (data.nick == "twipkr") {
    if ( (data.message.indexOf("ACTION")!=-1) && (data.message.indexOf("\\u0001")!=-1) ) {

      var amount = message.match(/ (\d+,)*\d{3}/g);
      var twipMessage = "";
      if  (amount == null) {
        twipMessage = twipMsg.replace("{bits}", "").
          replace(/\{0:([^\}]*)}/g, "$1").replace(/\{!0:([^\}]*)}/g, "");
      }
      else {
        amount = amount[0].split(" ")[1].replace(/[^\d]/g, "");
        twipMessage = twipMsg.replace("{bits}", amount).replace(/((\d)\s+)?비트/, "$2원").
          replace(/\{!0:([^\}]*)}/g, "$1").replace(/\{0:([^\}]*)}/g, "");
      }

      message = '<div class="chat_cheer_box">' + twipMessage + "</div>" + message;
    }
  }

  return message;
};
