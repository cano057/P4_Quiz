const fs = require ("fs");
const DB_FILENAME = "quizzes.json";


let quizzes = [
	{
		question: "capital de España",
		answer: "Madrid"
	}
];

/* carga la pregunta guardada en el fichero
*/

const load = () => {
	fs.readFile(DB_FILENAME, (err, data) => {
		if(err) {
			// no existe el fichero
			if(err.code === "ENOENT") {
				save(); //valores iniciales
				return;
			}
			throw err;
		}
		let json = JSON.parse(data);
		if(json) {
			quizzes = json;
		}
	});
};

/* Guarda las preguntas en el fichero
*/
const save = () => {
	fs.writeFile(DB_FILENAME,
		JSON.stringify(quizzes),
		err => {
			if(err) throw err;
	});
};

exports.count = () => quizzes.length;

exports.add = (question, answer) => {
	quizzes.push({
		question: (question || "").trim(),
		answer: (answer || "").trim()
	});
	save();
};

exports.update = (id, question, answer) => {
	const quiz = quizzes[id];
	if(typeof quiz === "undefined") {
		throw new Error('El valor del parámetro id no es válido');
		rl.prompt();	
	}
	quizzes.splice(id, 1, {
		question: (question || "").trim(),
		answer: (answer || "").trim()
	}),
	save();
};

exports.getAll = () => JSON.parse(JSON.stringify(quizzes));

exports.getByIndex = id => {
	const quiz = quizzes[id];
	if(typeof quiz === "undefined") {
		throw new Error('El valor del parámetro id no es válido');
	}
	return JSON.parse(JSON.stringify(quiz));
};

exports.deleteByIndex = id => {
	const quiz = quizzes[id];
	if(typeof quiz === "undefined") {
		throw new Error('El valor del parámetro id no es válido');
	}
	quizzes.splice(id, 1);
	save();
};

//Carga los elementos del quizzes en el fichero
load();
