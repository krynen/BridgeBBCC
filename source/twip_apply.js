var twipMsg =
	configData&&configData.twipCheersMsg?
	configData.twipCheersMsg: 
	configData.cheersMsg;

exports.apply = function(message, data) {
	if (data.nick == "twipkr") {
		if ( (message.indexOf("ACTION")!=-1) && (message.indexOf("\\u0001")!=-1) ) {
			message = message.replace(/\\u0001/g, "").replace("ACTION", "");
				
			var amount = message.match(/ (\d+,)*\d{3}/g);
			if  (amount == null) {
				twipMsg = twipMsg.replace("{bits}", "").
					replace(/\{0:([^\}]*)}/g, "$1").replace(/\{!0:([^\}]*)}/g, "");
			}
			else {
				amount = amount[0].split(" ")[1].replace(/[^\d]/g, "");
				twipMsg = twipMsg.replace("{bits}", amount).replace(/((\d)\s+)?비트/, "$2원").
					replace(/\{!0:([^\}]*)}/g, "$1").replace(/\{0:([^\}]*)}/g, "");
			}
			
			message = '<div class="chat_cheer_box">' + twipMsg + "</div>" + message;
		}
	}
	
	return message;
}