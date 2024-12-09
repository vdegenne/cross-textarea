#!/usr/bin/env node

import cors from '@koa/cors';
import Router from '@koa/router';
import Koa from 'koa';
import serve from 'koa-static';
import bodyParser from '@koa/bodyparser';
import {ifError} from 'assert';

const PORT = 35309;

const app = new Koa();
app.use(serve('./dist'));
app.use(cors());
app.use(bodyParser());

const router = new Router();

let localInput = '';

router.get('/api/get', (ctx) => {
	return (ctx.body = {input: localInput});
});

router.post('/api/save', (ctx) => {
	const {input} = ctx.request.body;
	if (input === undefined) {
		ctx.throw(400, 'input required');
	}
	localInput = input;
	return (ctx.body = 'success');
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}/`);
});
