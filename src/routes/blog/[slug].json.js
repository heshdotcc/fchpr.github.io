import { notFound, sendJson } from '../../utils/api';
import get_posts from './_posts.js';

let lookup;

export function get(req, res) {
	if (!lookup || process.env.NODE_ENV !== 'production') {
		lookup = new Map();
		get_posts().forEach(post => {
			lookup.set(post.slug, post);
		});
	}

	if (lookup.has(req.params.slug)) {
		sendJson(res, lookup.get(req.params.slug));
	} else {
		notFound(res);
	}
}