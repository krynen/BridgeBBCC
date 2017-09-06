var twipMsg =
	configData&&configData.twipCheersMsg?
	configData.twipCheersMsg: 
	configData.cheersMsg.replace("{bits}", "{wons}").replace(/\s*비트/, "원");

exports.apply = function(message, data) {
	if (data.nick == "twipkr") {
		if ( (message.indexOf("ACTION")!=-1) && (message.indexOf("후원함!")!=-1) ) {
			message = message.replace(/\\u0001/g, "").
				replace("ACTION", "").replace("을 후원함!", "원을 후원함!");
				
			var amount = message.match(/ (\d+,)*\d+원을 후원함!/g)[0].
				split(" ")[1].replace(/[^\d]/g, "");
				
			message = '<div class="chat_cheer_box">' +
				twipMsg.replace("{wons}", amount) +
				"</div>" + message;
		}
	}
	
	return message;
}