const figlet = require('figlet');
const chalk = require('chalk');

const colorize = (msg, color) => {
	if(typeof color !== "undefined") {
		msg = chalk[color].bold(msg);
	}
	return msg;
};

const log = (msg,color) => {
	console.log(colorize(msg, color));
};

const bigLog = (msg,color) => {
	log(figlet.textSync(msg, {horizontalLayout: 'full'}), color);
};

const errorlog = (msg) => {
	console.log(`${colorize("Error", "red")}: ${colorize(colorize(msg, "red"), "bgYellowBright")}`);
};

exports = module.exports = {
	colorize,
	log,
	bigLog,
	errorlog
};
