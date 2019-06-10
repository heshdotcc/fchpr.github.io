import { sendJson } from '../../utils/api';
import get_posts from './_posts.js';

let json;

export function get(req, res) {
	if (!json || process.env.NODE_ENV !== 'production') {
		json = get_posts()
			.filter(post => !post.metadata.draft)
			.map(post => {
				return {
					slug: post.slug,
					metadata: post.metadata
				};
			});
	}

	sendJson(res, json);
}