import {Serianilla} from "../../framework/Serianilla.js";
import {fetchFriends} from "../http/FriendsAPI.js";
import {FriendsList} from "../components/FriendsList.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {Dropdown} from "../components/ui/Dropdown.js";
import {ToggleButton} from "../components/ui/ToggleButton.js";

export const Friends = ({locationContext, notificationContext}) => {
    const [friends, setFriends] = Serianilla.useState([]);
    const [shouldLoadFriends, setShouldLoadFriends] = Serianilla.useState(true);
    const [sortValue, setSortValue] = Serianilla.useState('firstName');
    const [isSortAsc, setIsSortAsc] = Serianilla.useState(true);
    const [isLoading, setIsLoading] = Serianilla.useState(false);

    const sortOptions = [
        {value: 'firstName', name: 'First name'},
        {value: 'lastName', name: 'Last name'},
        {value: 'registeredTimestamp', name: 'Sign up time'},
        {value: 'dobTimestamp', name: 'Age'},
    ]

    Serianilla.useEffect(async () => {
        if (!shouldLoadFriends) {
            setFriends(getSortedFriends(friends, sortValue, isSortAsc));
            return;
        }
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        setShouldLoadFriends(false);
        try {
            const fetchedFriends = await fetchFriends();
            setFriends(getSortedFriends(fetchedFriends, sortValue, isSortAsc));
        } catch (err) {
            notificationContext.displayMessage('Error', err.message, 'error');
        }
        setIsLoading(false);
    });

    const compareFriends = (a, b, key) => {
        if (typeof a[key] === 'number')
            return  a[key] - b[key];
        return a[key].localeCompare(b[key])
    }

    const getSortedFriends = (friendsList, key, isAsc) => {
        return [...friendsList].sort(isAsc
            ? (a, b) => compareFriends(a, b, key)
            : (a, b) => compareFriends(b, a, key))
    }

    const imports = [FriendsList, Button, InputText, Dropdown, ToggleButton];

    const template = `
    <div class="app__container">
        <header class="fri__header">
            <h1 class="fri__title">My Friends</h1>
            <Button content="Log out" classes="fri__button"/>
        </header>
        <section class="fri__header">
            <InputText placeholder="Search for friend" />
            <div class="fri__action-buttons">
                <ToggleButton 
                    classes="fri__sort-toggle-btn"
                    isOn={isSortAsc}
                    onClass=""
                    offClass="fri__sort_desc" 
                    onToggle={handleSortToggle} />
                <Dropdown 
                    options={sortOptions} 
                    value={sortValue} 
                    onSelect={handleSortValueChanged} />
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
        isSortAsc,
        handleSortToggle: isAsc => setIsSortAsc(isAsc),
        handleSortValueChanged: key => setSortValue(key),
    };

    return {imports, template, attach};
}