import {API_RESULTS_COUNT, API_SEED, API_URL} from "../utils/consts.js";

export const fetchFriends = async (pageNumber = 1) => {
    const includes = ['name', 'phone', 'location', 'registered', 'picture', 'email', 'dob'];
    const nationality = 'ua';

    const params = {
        inc: includes.join(','),
        nat: nationality,
        page: pageNumber.toString(),
        results: API_RESULTS_COUNT.toString(),
        seed: API_SEED,
    }
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}?${query}`;
    console.log(url)

    const response = await fetch(url);

    return (await response.json()).results.map(res => new Object({
        photoURL: res.picture.large,
        firstName: res.name.first,
        lastName: res.name.last,
        city: res.location.city,
        country: res.location.country,
        email: res.email,
        age: res.dob.age,
        phoneNumber: res.phone
    }));
}

export const MOCK_fetchFriends = async (pageNumber = 1) => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    return [
        {
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },
        {
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },{
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },
        {
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },
        {
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },{
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },
        {
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },
        {
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },{
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },
        {
            photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
            firstName: 'Misha',
            lastName: 'Classic',
            city: 'Chernivtsi',
            country: 'Ukraine',
            email: 'misha.classic@gmail.com',
            age: '20',
            phoneNumber: '(034) 23-45-324'
        },
    ]
}