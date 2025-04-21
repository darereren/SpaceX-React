import React, { useState, useEffect } from 'react';
import './LaunchList.css';

function LaunchList() {
	const [launches, setLaunches] = useState([]);
	const [search, setSearch] = useState('');
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(true);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [expanded, setExpanded] = useState({});

	const limit = 10;

	const fetchLaunches = (reset = false) => {
    const query = `https://api.spacexdata.com/v3/launches?limit=${limit}&offset=${reset ? 0 : offset}&sort=flight_number&order=desc`;
    (reset ? setLoading(true) : setLoadingMore(true));

    fetch(query)
		.then(res => res.json())
		.then(data => {
			if (data.length < limit) setHasMore(false);
			setLaunches(prev => reset ? data : [...prev, ...data]);
			setOffset(prev => reset ? limit : prev + limit);
			setExpanded({});
			setLoading(false);
			setLoadingMore(false);
		})
		.catch(err => {
			console.error('Error fetching launches:', err);
			setLoading(false);
			setLoadingMore(false);
		});
	};

	const fetchByPayloadId = (payloadId) => {
		setLoading(true);
		fetch(`https://api.spacexdata.com/v3/launches`)
		.then(res => res.json())
		.then(data => {
			const filtered = data.filter(launch =>
			launch.rocket.second_stage.payloads.some(p =>
				p.payload_id.toLowerCase().includes(payloadId.toLowerCase())
			)
			);
			setLaunches(filtered);
			setHasMore(false);
			setOffset(0);
			setExpanded({});
			setLoading(false);
		})
		.catch(err => {
			console.error('Error fetching by payload ID:', err);
			setLoading(false);
		});
	};

	useEffect(() => {
		if (search.trim()) {
		fetchByPayloadId(search);
		} else {
		setOffset(0);
		setHasMore(true);
		fetchLaunches(true);
		}
	}, [search]);

	const handleScroll = (e) => {
		const el = e.target;
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50 && hasMore && !loadingMore) {
		fetchLaunches();
		}
	};

	const toggleExpanded = (index) => {
		setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
	};

	const getTimeAgo = (dateStr) => {
		const diff = Date.now() - new Date(dateStr);
		const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
		return years > 0 ? `${years} year${years > 1 ? 's' : ''} ago` : 'Recently';
	};

	return (
		<div className="launch-list-container">
			<input
				type="text"
				className="search-bar"
				placeholder="Search..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			<div className="scrollable-list" onScroll={handleScroll}>
				{loading ? (
				<div className="loading-spinner" />
				) : (
				<ul className="launch-list">
					{launches.map((launch, index) => (
					<li key={index} className="launch-card">
						<div className="card-content">
						<div className="launch-header">
							<strong className="mission-name">
							{launch.rocket.second_stage.payloads.map(p => p.payload_id).join(', ')}
							</strong>
							{launch.upcoming ? (
							<span className="badge upcoming">upcoming</span>
							) : launch.launch_success ? (
							<span className="badge success">success</span>
							) : (
							<span className="badge failed">failed</span>
							)}
						</div>
						<div className="launch-actions">
							<button className="view-button" onClick={() => toggleExpanded(index)}>
							{expanded[index] ? 'HIDE' : 'VIEW'}
							</button>
						</div>
						</div>
						{expanded[index] && (
						<div className="expanded-content">
							<div className="expanded-top-row">
							<span>{getTimeAgo(launch.launch_date_utc)}</span>
							{launch.links.article_link && <span> | <a href={launch.links.article_link} target="_blank" rel="noreferrer">Article</a></span>}
							{launch.links.video_link && <span> | <a href={launch.links.video_link} target="_blank" rel="noreferrer">Video</a></span>}
							</div>
							<div className="expanded-bottom-row">
							{launch.links.mission_patch_small && (
								<img src={launch.links.mission_patch_small} alt="Mission Patch" className="mission-patch" />
							)}
							<p className="details">{launch.details || 'No details available.'}</p>
							</div>
						</div>
						)}
					</li>
					))}
					{loadingMore && <div className="loading-spinner" />}
					{!hasMore && !loading && <p className="no-more-results">No more results</p>}
				</ul>
				)}
			</div>
		</div>
	);
}

export default LaunchList;