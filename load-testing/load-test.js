
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
    ],

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<1000'],
    },
};

export default function () {
    const response = http.get(
        'http://host.docker.internal:5000/health'
    );

    check(response, {
        'status is 200': (r) => r.status === 200,
        'backend is healthy': (r) =>
            r.json('success') === true,
    });

    sleep(1);
}
