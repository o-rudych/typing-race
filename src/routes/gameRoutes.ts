import { Router } from 'express';
import path from 'path';
import { HTML_FILES_PATH } from '../config';
import { texts } from '../data';

const router = Router();

router.get('/texts/:id', function (req, res) {
	const text = texts[req.params.id];
	if (text) {
		res.send(JSON.stringify(text));
	} else {
		res.status(404).send(JSON.stringify({
			error: true,
			message: "Text not found"
		}));
	}

});

router.get('/', (req, res) => {
	const page = path.join(HTML_FILES_PATH, 'game.html');
	res.sendFile(page);
});

export default router;
