let Discord = require('discord.io');
let logger = require('winston');
const fs = require('fs');
let auth = require('./auth.json');
let state = require('./state.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
let bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

let authorizedRoles = auth.authorizedRoles; //'Taupe FR Modo', 'Taupe FR Admin'

let msgId = state.msgId;
let mapDaysMsg = state.mapDaysMsg || {
	0: [],
	1: [],
	2: [],
	3: [],
	4: [],
	5: [],
	6: []
};

const nbDays = 7;
const currLang = 'fr';
const mapDaysLang = {
	0: {'fr':'Lundi', 'en':'Monday'},
	1: {'fr':'Mardi', 'en':'Tuesday'},
	2: {'fr':'Mercredi', 'en':'Wednesday'},
	3: {'fr':'Jeudi', 'en':'Thursday'},
	4: {'fr':'Vendredi', 'en':'Friday'},
	5: {'fr':'Samedi', 'en':'Saturday'},
	6: {'fr':'Dimanche', 'en':'Sunday'}
};

const twitter_application_consumer_key = auth.twitter_application_consumer_key;  // API Key
const twitter_application_secret = auth.twitter_application_secret;  // API Secret
const twitter_user_access_token = auth.twitter_user_access_token;  // Access Token
const twitter_user_secret = auth.twitter_user_secret;  // Access Token Secret
const twitch_channel = auth.twitch_channel;//'https://twitch.tv/lataupefr';
	
function getWrongDayMsg(){
	switch(currLang) {
		case 'fr':
			return 'Le jour de la semaine n\'a pas été trouvé.';
		case 'en':
			return 'Day of the week is invalid.';
	}
}

function getEmptyTweetDayMsg(){
	switch(currLang) {
		case 'fr':
			return 'Rien à tweeter pour cette journée.';
		case 'en':
			return 'Nothing to tweet about that day.';
	}
}

function getStartingTweetMsg(dayNb){
	switch(currLang) {
		case 'fr':
			return 'Au programme de ce ' + mapDaysLang[dayNb][currLang] + ' : \n';
		case 'en':
			return 'Schedule for this '  + mapDaysLang[dayNb][currLang] + ' : \n';
	}
}

function getWrongArgNbMsg(){
	switch(currLang) {
		case 'fr':
			return 'Le nombre d\'arguments est incorrect.';
		case 'en':
			return 'Wrong number of arguments.';
	}
}

function getWrongLineMsg(){
	switch(currLang) {
		case 'fr':
			return 'La ligne à mettre à jour n\'existe pas.';
		case 'en':
			return 'Invalid line number.';
	}
}

function getHelpMsg(){
	var hlpMsg = '';
	switch(currLang) {
		case 'fr':
			hlpMsg += '**!setup**\n';
			hlpMsg += '\t -Crée le 1er message du bot \n\n';
			
			hlpMsg += '**!add** *jour runner1 runner2 heure [comm1] [comm2]*\n';
			hlpMsg += '\t -Ajoute une ligne au jour souhaité\n';
			hlpMsg += '\t -*Ex: !add Lu Shigan Future 22h* \n\n';
			
			hlpMsg += '**!upd** *jour ligne comm1 [comm2]*\n';
			hlpMsg += '\t -Met à jour la ligne souhaitée au jour souhaité\n';
			hlpMsg += '\t -Si un commentateur est déjà présent, le paramètre remplacera l\'emplacement vide.\n';
			hlpMsg += '\t -Si les commentateurs sont envoyés en paramètre, les 2 emplacements seront remplacés.\n';
			hlpMsg += '\t -*Ex: !upd Lu 1 Sakk* \n\n'; 
			
			hlpMsg += '**!del** *jour ligne*\n';
			hlpMsg += '\t -Supprime la ligne souhaitée au jour souhaité\n';
			hlpMsg += '\t -*Ex: !del Lu 1*\n\n';
			
			hlpMsg += '**!pos** *jour ligneAreplacer position*\n';
			hlpMsg += '\t -Déplace la ligne d\'un jour à la position souhaitée\n';
			hlpMsg += '\t -*Ex: !pos Lu 3 2 (déplace la ligne 3 à la position 2 du Lundi)*\n\n';
			
			hlpMsg += '**!manual** *jour phrase*\n';
			hlpMsg += '\t -Ecrit la phrase au jour désiré\n';
			hlpMsg += '\t -*Ex: !manual Lu Tournoi Isaac à partir de 20h*\n\n';
			
			hlpMsg += '-Formats de jour acceptés : Lundi, Lu, 1\n';
			hlpMsg += '-Les [paramètres] entre crochets sont optionnels.\n';
			hlpMsg += '-Si un paramètre doit contenir des espaces, le nommer entre " ". Ex : !add Lu run1 run2 "après Shigan/Future"';
			
			break;
		case 'en':
			hlpMsg += '**!setup**\n';
			hlpMsg += '\t -Create the 1st bot\'s message.\n\n';
			
			hlpMsg += '**!add** *day runner1 runner2 time [cast1] [cast2]\n';
			hlpMsg += '\t -Add a line at the chosen day.\n';
			hlpMsg += '\t -*Ex: !add Mo Shigan Future 8PM* \n\n';
			
			hlpMsg += '**!upd** *day line cast1 [cast2]*\n';
			hlpMsg += '\t -Update the chosen line at the chosen day\n';
			hlpMsg += '\t -If a caster\'s already there, the paramter will replace the free spot.\n';
			hlpMsg += '\t -If both casters are sent through parameters, both spots will be replaced.\n';
			hlpMsg += '\t -*Ex: !upd Mo 1 Sakk* \n\n'; 
			
			hlpMsg += '**!del** *day line*\n';
			hlpMsg += '\t -Delete the chosen line at the chosen day\n';
			hlpMsg += '\t -*Ex: !del Mo 1*\n\n';
			
			hlpMsg += '**!pos** *day lineToReplace position*\n';
			hlpMsg += '\t -Move the line of a day to the chosen position\n';
			hlpMsg += '\t -*Ex: !pos Mo 3 2 (move line 3 to position 2 on Monday)*\n\n';
			
			hlpMsg += '**!manual** *day sentence*\n';
			hlpMsg += '\t -Write the sentence on the chosen day\n';
			hlpMsg += '\t -*Ex: !manual Mo Isaac tournament starting at 9PM*\n\n';
			
			hlpMsg += '-Day formats accepted : Monday, Mo, 1\n';
			hlpMsg += '-[Parameters] between brackets are optionnal.\n';
			hlpMsg += '-If a parameter will use a space/blank then use " ". Ex : !add Mo run1 run2 "after Shigan/Future"';
			break;
	}
	return hlpMsg;
}

function getSetupMsg(){
	return getDisplayMsg();
}

function getDisplayMsg(){
	var msg = '';
	for (var i=0; i<nbDays; i++){
		msg += '__**' + mapDaysLang[i][currLang] + ' :**__';
		msg += '```';
		for (var j=0; j<mapDaysMsg[i].length; j++){
			msg += mapDaysMsg[i][j];
			if (j<mapDaysMsg[i].length-1)
				msg += '\n';
		}
		msg += ' ```\n';
	}
	return msg;
}

function getDayNb(argDay){
	var dayNb;
	if (!isNaN(argDay))
		argDay = parseInt(argDay);
	if (Number.isInteger(argDay) && argDay >= 1 && argDay <= 7){
		dayNb = argDay - 1;
	}
	else{
		for (var i=0; i<nbDays; i++){
			if (mapDaysLang[i][currLang].toLowerCase() == argDay.toLowerCase()
				|| (argDay.length >= 2 && mapDaysLang[i][currLang].toLowerCase().startsWith(argDay.toLowerCase()))
				){
				dayNb = i;
				break;
			}
		}
	}
	return dayNb;
}

function deleteMsgDelay(chanId, mesId, timeout=5000){
	setTimeout(
		function (){
			bot.deleteMessage({
				channelID: chanId,
				messageID: mesId
			});
		},
		timeout
	);
}

function addToMsg(args, channelID){
	if (args == null || args.length < 4 || args.length > 6){
		bot.sendMessage({
			to: channelID,
			message: getWrongArgNbMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var dayNb = getDayNb(args[0]);
	
	if (dayNb == null || dayNb < 0 || dayNb > 6){
		bot.sendMessage({
			to: channelID,
			message: getWrongDayMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	else {
		var addMsg = args[1] + ' vs ' + args[2] + ' ';
		
		if (args[3].startsWith('"') && args[3].endsWith('"')){
			addMsg += args[3].substring(1, args[3].length-1) + ' ';
		}
		else{
			addMsg += args[3] + ' ';
		}
		
		if (args.length == 5){
			addMsg += '|'+args[4]+'|?|';
		}
		else if (args.length == 6){
			addMsg += '|'+args[4]+'|' + args[5] + '|';
		}
		else {
			addMsg += '|?|?|';
		}
		mapDaysMsg[dayNb].push(addMsg);
	}
	return 'ok';
}

function updMsg(args, channelID){
	if (args == null || args.length < 3 || args.length > 4){
		bot.sendMessage({
			to: channelID,
			message: getWrongArgNbMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var dayNb = getDayNb(args[0]);
	
	if (dayNb == null || dayNb < 0 || dayNb > 6){
		bot.sendMessage({
			to: channelID,
			message: getWrongDayMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var argLineNb = args[1];
	var lineNb;
	if (!isNaN(argLineNb)) 
		argLineNb = parseInt(argLineNb);
	if (isNaN(argLineNb) || mapDaysMsg[dayNb].length < argLineNb-1){
		bot.sendMessage({
			to: channelID,
			message: getWrongLineMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	else{
		lineNb = argLineNb-1;
	}
	
	if (args.length == 3){
		mapDaysMsg[dayNb][lineNb] = mapDaysMsg[dayNb][lineNb].replace('?', args[2]);
	}
	else if (args.length == 4){
		var pos1 = mapDaysMsg[dayNb][lineNb].indexOf('|');
		var pos2 = pos1 + mapDaysMsg[dayNb][lineNb].substring(pos1).indexOf('|');
		var pos3 = pos2 + mapDaysMsg[dayNb][lineNb].substring(pos2).indexOf('|');
		mapDaysMsg[dayNb][lineNb] = mapDaysMsg[dayNb][lineNb].substring(0, pos1+1) + args[2] 
									+ mapDaysMsg[dayNb][lineNb].substring(pos2, pos2+1) + args[3]
									+ mapDaysMsg[dayNb][lineNb].substring(pos3, pos3+1);
	}
	
	return 'ok';
}

function delMsg(args, channelID){
	if (args == null || args.length != 2){
		bot.sendMessage({
			to: channelID,
			message: getWrongArgNbMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var dayNb = getDayNb(args[0]);
	
	if (dayNb == null || dayNb < 0 || dayNb > 6){
		bot.sendMessage({
			to: channelID,
			message: getWrongDayMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var argLineNb = args[1];
	var lineNb;
	if (!isNaN(argLineNb)) 
		argLineNb = parseInt(argLineNb);
	if (isNaN(argLineNb) || mapDaysMsg[dayNb].length < argLineNb-1 || argLineNb-1 < 0){
		bot.sendMessage({
			to: channelID,
			message: getWrongLineMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	else{
		lineNb = argLineNb-1;
	}
	
	mapDaysMsg[dayNb].splice(lineNb, 1);
	return 'ok';
}

function reposMsg(args, channelID){
	if (args == null || args.length != 3){
		bot.sendMessage({
			to: channelID,
			message: getWrongArgNbMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var dayNb = getDayNb(args[0]);
	
	if (dayNb == null || dayNb < 0 || dayNb > 6){
		bot.sendMessage({
			to: channelID,
			message: getWrongDayMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var argLineNb = args[1];
	var lineNb;
	if (!isNaN(argLineNb)) 
		argLineNb = parseInt(argLineNb);
	if (isNaN(argLineNb) || mapDaysMsg[dayNb].length < argLineNb-1 || argLineNb-1 < 0){
		bot.sendMessage({
			to: channelID,
			message: getWrongLineMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	else{
		lineNb = argLineNb-1;
	}
	
	var argLineNbToGo = args[2];
	var lineNbToGo;
	if (!isNaN(argLineNbToGo)) 
		argLineNbToGo = parseInt(argLineNbToGo);
	if (isNaN(argLineNbToGo) || mapDaysMsg[dayNb].length < argLineNbToGo-1 || argLineNbToGo-1 < 0){
		bot.sendMessage({
			to: channelID,
			message: getWrongLineMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	else{
		lineNbToGo = argLineNbToGo-1;
	}
	
	var currMsgLine = mapDaysMsg[dayNb][lineNb];
	mapDaysMsg[dayNb].splice(lineNb, 1);
	mapDaysMsg[dayNb].splice(lineNbToGo, 0, currMsgLine);
	
	return 'ok';
}


function manualMsg(args, channelID){
	if (args == null || args.length < 2){
		bot.sendMessage({
			to: channelID,
			message: getWrongArgNbMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var dayNb = getDayNb(args[0]);
	
	if (dayNb == null || dayNb < 0 || dayNb > 6){
		bot.sendMessage({
			to: channelID,
			message: getWrongDayMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	args.splice(0, 1);
	var manMsg = args.join(' ');
	mapDaysMsg[dayNb].push(manMsg);
	
	return 'ok';
}

function getScheduleTweetMsg(matchLs, dayNb){
	var msg = getStartingTweetMsg(dayNb);
	for (var i=0; i<matchLs.length; i++){
		msg += ' - ' + matchLs[i].substring(0, matchLs[i].indexOf('|')) + '\n';
	}
	msg += twitch_channel;
	return msg;
}

function tweet(args, channelID){
	var dayNb = getDayNb(args[0]);
	if (dayNb == null || dayNb < 0 || dayNb > 6){
		bot.sendMessage({
			to: channelID,
			message: getWrongDayMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	if (mapDaysMsg[dayNb].length == 0){
		bot.sendMessage({
			to: channelID,
			message: getEmptyTweetDayMsg()
		}, function(err, res){
			deleteMsgDelay(channelID, res.id);
		});
		return;
	}
	
	var OAuth = require('oauth');
	
	var oauth = new OAuth.OAuth(
		'https://api.twitter.com/oauth/request_token',
		'https://api.twitter.com/oauth/access_token',
		twitter_application_consumer_key,
		twitter_application_secret,
		'1.0A',
		null,
		'HMAC-SHA1'
	);

	var status = getScheduleTweetMsg(mapDaysMsg[dayNb], dayNb);  // This is the tweet (ie status)
	
	var postBody = {
		'status': status
	};

	// console.log('Ready to Tweet article:\n\t', postBody.status);
	oauth.post('https://api.twitter.com/1.1/statuses/update.json',
		twitter_user_access_token,  // oauth_token (user access token)
		twitter_user_secret,  // oauth_secret (user secret)
		postBody,  // post body
		'',  // post content type ?
		function(err, data, res) {
			if (err) {
				console.log(err);
			} else {
				// console.log(data);
			}
		}
	);
	
}

function saveState(){
	var stateJson = {
		"msgId": msgId,
		"mapDaysMsg": mapDaysMsg
	};
	fs.writeFile("./state.json", JSON.stringify(stateJson), function(err) {
		if(err) {
			return console.log(err);
		}
	});
}

function resetState(){
	var stateJson = {
		"msgId": "",
		"mapDaysMsg": ""
	};
	fs.writeFile("./state.json", JSON.stringify(stateJson), function(err) {
		if(err) {
			return console.log(err);
		}
	});
}

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
		let serverId = bot.channels[channelID].guild_id;
		let member = bot.servers[serverId].members[userID];
		let globalRoles = bot.servers[serverId].roles;
		if (!member)
			return;
		let memberRoles = member.roles;
		let allowUser = false;
		if (memberRoles){
			for (var i=0; i<memberRoles.length; i++){
				if (globalRoles[memberRoles[i]] && authorizedRoles.includes(globalRoles[memberRoles[i]].name)){
					allowUser = true;
					break;
				}
			}
		}
		if (allowUser){
			let args = message.substring(1).match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);
			//let args = message.substring(1).split(' ');
			if (args == null)
				return;
			let cmd = args[0];
		   
			args = args.splice(1);
			switch(cmd) {
				// !setup
				case 'setup':
					resetState();
					mapDaysMsg = {
						0: [],
						1: [],
						2: [],
						3: [],
						4: [],
						5: [],
						6: []
					}
					bot.sendMessage({
						to: channelID,
						message: getSetupMsg()
					}, function(err, res){
						msgId = res.id;
						saveState();
					});
					break;
				// !add - args are : day runnner1 runner2 time [caster1] [caster2]
				case 'add':
					var newMsg = addToMsg(args, channelID);
					if (!newMsg)
						break;
					
					bot.editMessage({
					   channelID: channelID,
					   messageID: msgId,
					   message: getDisplayMsg()
					});
					break;
				// !upd - args are : day lineNumber cast1 [cast2]
				case 'upd':
					var newMsg = updMsg(args, channelID);
					if (!newMsg)
						break;
					
					bot.editMessage({
					   channelID: channelID,
					   messageID: msgId,
					   message: getDisplayMsg()
					});
					break;
				// !del - args are : day lineNumber
				case 'del':
					var newMsg = delMsg(args, channelID);
					if (!newMsg)
						break;
					
					bot.editMessage({
					   channelID: channelID,
					   messageID: msgId,
					   message: getDisplayMsg()
					});
					break;
				// !pos - args are : day posOfLine posToRGo
				case 'pos':
					var newMsg = reposMsg(args, channelID);
					if (!newMsg)
						break;
					
					bot.editMessage({
					   channelID: channelID,
					   messageID: msgId,
					   message: getDisplayMsg()
					});
					break;
				// !manual - args day + everything else after the day
				case 'manual':
					var newMsg = manualMsg(args, channelID);
					if (!newMsg)
						break;
					
					bot.editMessage({
					   channelID: channelID,
					   messageID: msgId,
					   message: getDisplayMsg()
					});
					break;
				//!tweet - args are : day
				case 'tweet':
					tweet(args, channelID);
					break;
				// !helpPlanning - args are : cmdName
				case 'helpPlanning':
					bot.sendMessage({
					   to: channelID,
					   message: getHelpMsg()
					}, function(err, res){
						deleteMsgDelay(channelID, res.id, 15000);
					});
					break;
				// Just add any case commands if you want to..
			 }
			 saveState();
		}
		deleteMsgDelay(channelID, evt.d.id);
    }
});
