const Sequelize = require('sequelize');
const {log, bigLog, errorlog, colorize} = require('./out');
const {models} = require('./model');

exports.helpCmd = (socket, rl) => {
	log(socket, "Comandos");
	log(socket, " h|help - Muestra esta ayuda.");
	log(socket, " list - Listar los quizzes existentes.");
	log(socket, " show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
	log(socket, " add - Añadir un nuevo quiz iteractivamente");
	log(socket, " delete <id> - Borrar el quiz indicado.");
	log(socket, " edit <id> - Editar el quiz indicado.");
	log(socket, " test <id> - Probar el quiz indicado.");
	log(socket, " p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	log(socket, " credits - Créditos.");
	log(socket, " q|quit - Salir del programa");
	rl.prompt();
};

exports.listCmd = (socket, rl) => {
models.quiz.findAll()
.then(quizzes => {
	quizzes.forEach((quiz) => {
		log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	});
})
.catch(error => {
	errorlog(socket, error.message);
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

exports.showCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.` );
		}
		log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
	errorlog(socket, error.message);
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

exports.addCmd = (socket, rl) => {
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
		log(socket, ` ${colorize('Se ha añadido', 'magenta')} : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.deleteCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.editCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		
		process.stdout.isTTY && setTimeout(() => {socket.write(quiz.question)},0);
		return makeQuestion(rl, ' Introduzca una pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {socket.write(quiz.answer)},0);
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
		log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.testCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id} .`);
		}
		return makeQuestion(rl,(`${quiz.question}: `))
		.then(a => {
			if (quiz.answer.toLowerCase().trim() === a.toLowerCase().trim()) {
				log(socket, ` Su respuesta es correcta.`, 'white');
				bigLog(socket, 'CORRECTA', 'green');
			} else {
				console.log(` Su respuesta es incorrecta.`);
				bigLog(socket, 'INCORRECTA', 'red');
			}
		});

	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo');
		error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.playCmd = (socket, rl) => {
	let score = 0;
	let toBeResolved = [];
	
	const playMethod = () => {
		return new Promise((resolve,reject) => {
			
			if(toBeResolved.length <= 0){
				log(socket, "No hay nada mas que preguntar.");
				log(socket, "Fin del examen. Aciertos:");
				bigLog(socket, score, 'magenta');
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
					log(socket, `CORRECTO - Lleva ${score} aciertos`);
					resolve(playMethod());
				} else {
					log(socket, "INCORRECTO.");
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
		errorlog(socket, error);
	})
	.then(() => {
		rl.prompt();
	});
	
}; 

exports.creditsCmd = (socket, rl) => {
	log(socket, 'Quiz realizado por: ');
	log(socket, 'Manuel Cano Rueda.');
	rl.prompt();
};
