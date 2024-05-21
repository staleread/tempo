import {Serianilla} from "../../framework/Serianilla.js";
import {fetchFriends} from "../http/FriendsAPI.js";
import {FriendsList} from "../components/FriendsList.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {Dropdown} from "../components/ui/Dropdown.js";

export const Friends = ({locationContext, notificationContext}) => {
    const [friends, setFriends] = Serianilla.useState([]);
    const [friendsChanged, setFriendsChanged] = Serianilla.useState(true);
    const [sortValue, setSortValue] = Serianilla.useState('firstName');
    const [isLoading, setIsLoading] = Serianilla.useState(false);

    const sortOptions = [
        {value: 'firstName', name: 'First name'},
        {value: 'lastName', name: 'Last name'},
        {value: 'registeredTimestamp', name: 'Sign up time'},
        {value: 'dobTimestamp', name: 'Age'},
    ]

    Serianilla.useEffect(async () => {
        if (!friendsChanged) {
            return;
        }
        setIsLoading(true);
        try {
            const fetchedFriends = await fetchFriends()
            setFriends(getSortedFriends(fetchedFriends, sortValue));
            setFriendsChanged(false);
        } catch (err) {
            notificationContext.displayMessage('Error', err.message, 'error');
        }
        setIsLoading(false);
    }, [friendsChanged]);

    const getSortedFriends = (friendsList, key) => {
        return [...friendsList].sort((a, b) => {
            if (typeof a[key] === 'number')
                return a[key] - (b[key]);
            return a[key].localeCompare(b[key]);
        })
    }

    const imports = [FriendsList, Button, InputText, Dropdown];

    const template = `
    <div class="app__container">
        <header class="fri__header">
            <h1 class="fri__title">My Friends</h1>
            <Button content="Log out" classes="fri__button"/>
        </header>
        <section class="fri__header">
            <InputText placeholder="Search for friend" />
            <div class="fri__action-buttons">
                <Dropdown options={sortOptions} value={sortValue} onSelect={sortFriends}/>
                <Button content="Filter" classes="fri__button"/>            
            </div>
        </section>
        <FriendsList friends={friends} isLoading={isLoading}/>
    </div>`;

    const attach = {
        friends,
        isLoading,
        sortOptions,
        sortValue,
        sortFriends: key => {
            setFriends(getSortedFriends(friends, key));
            setSortValue(key);
        },
    };

    return {imports, template, attach};
}