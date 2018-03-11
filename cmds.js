const Sequelize = require('sequelize');
const {log, bigLog, errorlog, colorize} = require('./out');
const {models} = require('./model');

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
models.quiz.findAll()
.then(quizzes => {
	quizzes.forEach((quiz) => {
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	});
})
.catch(error => {
	errorlog(error.message);
})
.then(() => {
	rl.prompt();
});

};

const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id);
			if(Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};

exports.showCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.` );
		}
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
	errorlog(error.message);
	})
	.then(() => {
	rl.prompt();
	});

};

const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.addCmd = rl => {
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca la respuesta ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(` ${colorize('Se ha añadido', 'magenta')} : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.editCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return makeQuestion(rl, ' Introduzca una pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
			return makeQuestion(rl, ' Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then((quiz) => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.testCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id} .`);
		}
		return makeQuestion(rl,(`${quiz.question}: `))
		.then(a => {
			if (quiz.answer.toLowerCase().trim() === a.toLowerCase().trim()) {
				console.log(` Su respuesta es correcta.`);
				bigLog('CORRECTA', 'green');
			} else {
				console.log(` Su respuesta es incorrecta.`);
				bigLog('INCORRECTA', 'red');
			}
		});

	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = [];
	
	const playMethod = () => {
		return new Promise((resolve,reject) => {
			
			if(toBeResolved.length <= 0){
				console.log("No hay nada mas que preguntar.");
				console.log("Fin del examen. Aciertos:");
				bigLog(score, 'magenta');
				resolve();
				return;
			}
			let id = Math.floor(Math.random()*(toBeResolved.length -1));
			let quizArray = toBeResolved[id];
			
			makeQuestion(rl, `${quizArray.question}? `)
			.then(answer => {
				if(answer.toLowerCase().trim() === quizArray.answer.toLowerCase().trim()){
					score++;
					toBeResolved.splice(id,1);
					console.log(`CORRECTO - Lleva ${score} aciertos`);
					resolve(playMethod());
				} else {
					console.log("INCORRECTO.");
					toBeResolved.splice(0,toBeResolved.length);							
					resolve(playMethod());
				}	
			});
		});
	};
	
	models.quiz.findAll({raw: true})
	.then(quizzes => {
		quizzes.forEach((quiz) => {
			toBeResolved.push(quiz);
		});
	})
	.then(() => {
		return playMethod();
	})
	.catch(error => {
		console.log(error);
	})
	.then(() => {
		rl.prompt();
	});
	
}; 

exports.creditsCmd = rl => {
	console.log('Quiz realizado por: ');
	console.log('Manuel Cano Rueda.');
	rl.prompt();
};
