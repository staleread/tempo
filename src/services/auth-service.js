const USER_DATA_KEY = 's4e32q-32423-2348234-234'

export async function login(formData) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const dataString = localStorage.getItem(USER_DATA_KEY);

    if (!dataString) {
        return {
            isSuccess: false,
            message: 'No users yet, register first'
        }
    }

    const users = JSON.parse(dataString);
    const username = formData.get('username');
    const user = users.find(u => u.username === username);

    if (!user) {
        return {
            isSuccess: false,
            message: 'No such user'
        }
    }

    const password = formData.get('password');

    if (password !== user.password) {
        return {
            isSuccess: false,
            message: 'Password is not correct'
        }
    }

    return {
        isSuccess: true,
        message: 'Logged in successfully'
    }
}

export async function signUp(formData) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const dataString = localStorage.getItem(USER_DATA_KEY);
    
    const users = dataString ? JSON.parse(dataString) : [];
    const username = formData.get('username');

    if (users.find(u => u.username === username)) {
        return {
            isSuccess: false,
            message: 'This username is already taken'
        }
    }

    const user = {};

    for (const [key, value] of formData.entries()) {
        user[key] = value;
    }

    users.push(user)
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(users));

    return {
        isSuccess: true,
        message: 'Signed up successfully'
    }
}