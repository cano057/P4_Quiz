const {log, bigLog, errorlog, colorize} = require('./out');
const model = require('./model');

exports.helpCmd = rl => {
	console.log("Comandos");
	console.log(" h|help - Muestra esta ayuda.");
	console.log(" list - Listar los quizzes existentes.");
	console.log(" show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
	console.log(" add - Añadir un nuevo quiz iteractivamente");
	console.log(" delete <id> - Borrar el quiz indicado.");
	console.log(" edit <id> - Editar el quiz indicado.");
	console.log(" test <id> - Probar el quiz indicado.");
	console.log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	console.log(" credits - Créditos.");
	console.log(" q|quit - Salir del programa");
	rl.prompt();
};

exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		console.log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	rl.prompt();
};

exports.showCmd = (rl, id) => {
	if (typeof id === "undefined")  {
		errorlog('Falta el Parámetro id.');
	} else {
		try {
			const quiz = model.getByIndex(id);
			console.log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

exports.addCmd = rl => {
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {		
			model.add(question, answer);
			console.log(` ${colorize('Se ha añadido', 'magenta')} : ${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});
};

exports.deleteCmd = (rl, id) => {
	if (typeof id === "undefined")  {
		errorlog('Falta el Parámetro id.');
	} else {
		try {
			const quiz = model.getByIndex(id);
			console.log(` borrado pregunta [${colorize(id, 'magenta')}]: ${quiz.question}`);
			model.deleteByIndex(id);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

exports.editCmd = (rl, id) => {
	if (typeof id === "undefined")  {
		errorlog('Falta el Parámetro id.');
	} else {
		try {
			const quiz = model.getByIndex(id);
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
				rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {		
					model.update(id,question, answer);
					console.log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
				rl.prompt();
				});
			});
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

exports.testCmd = (rl, id) => {
	if (typeof id === "undefined")  {
		errorlog('Falta el Parámetro id.');
		rl.prompt();
	} else {
		try {
			const quiz = model.getByIndex(id);
			rl.question(colorize(quiz.question + '? ', 'red'), (answer) => {		
				if (quiz.answer.toLowerCase().trim() === answer.toLowerCase().trim()) {
					console.log(` Su respuesta es correcta.`);
					bigLog('CORRECTA', 'green');
					rl.prompt();
				} else {
					console.log(` Su respuesta es incorrecta.`);
					bigLog('INCORRECTA', 'red');
					rl.prompt();
				}
			});
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();	
};

exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = []; //array con los id de las preguntas existentes
	model.getAll().forEach((quiz, id) => {
		toBeResolved.push(quiz);
	});
	const playOne = () => {
		try{
			if(toBeResolved.length === 0) {
				console.log(`No hay nada más que preguntar.`);
				console.log(`Fin del examen. Aciertos:`);
				bigLog(score, 'magenta');
				rl.prompt(); 
				return;
			} else {
				let id = Math.floor(Math.random() * (toBeResolved.length - 1));
				let quiz = toBeResolved[id];
				rl.question(colorize(quiz.question + '? ', 'red'), (answer) => {		
					if (quiz.answer.toLowerCase().trim() === answer.toLowerCase().trim()) {
						score ++;
						toBeResolved.splice(id, 1);
						console.log(`CORRECTO - Lleva ${score} aciertos`);
						playOne();
					} else {
						toBeResolved.splice(0,toBeResolved.length);
						console.log(`INCORRECTO`);
						playOne();
					}
				});
			}
		} catch(error) {
			errorlog(error.message);
			rl.prompt;
		}
	}
	playOne();
}; 

exports.creditsCmd = rl => {
	console.log('Quiz realizado por: ');
	console.log('Manuel Cano Rueda.');
	rl.prompt();
};
