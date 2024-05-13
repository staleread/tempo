const template = document.createElement('template');

template.innerHTML = `
<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:host {
    display: block;
}

.tab-buttons {
    display: flex;
    flex-direction: row;
    gap: 10px;
    height: 30px;
    
    & button {
        padding: 5px 15px;
        font-size: 18px;
        border: none;
        outline: none;
        border-radius: 10px;
        background-color: orange;
        
        &.active {
            background-color: blue;
        }
    }
}

::slotted([data-tabname].is-hidden) {
    display: none;
}

</style>

<section class="wrapper">
    <div class="tab-buttons"></div>
    <div class="tabs">
        <slot></slot>
    </div>
</section>`;

export default class Tab extends HTMLElement {
    elems = {};

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.elems = {
            tabButtonsContainer: this.shadowRoot.querySelector('.tab-buttons'),
        }
    }

    connectedCallback() {
        setTimeout(() => {
            this.elems.tabs = this.shadowRoot.host.querySelectorAll('[data-tabname]');
            this.createTabs();
        }, 0)
    }

    createTabs() {
        this.elems.tabs.forEach(page => {
            const button = document.createElement('button');
            button.classList.add('tab-btn');

            if (page === this.elems.tabs[0]) {
                this.currentTabPage = page;
                this.currentBtn = button;
                button.classList.add('active');
            } else {
                page.classList.add('is-hidden');
            }

            button.innerText = page.dataset.tabname;
            this.elems.tabButtonsContainer.appendChild(button);
        })

        this.elems.tabButtonsContainer.addEventListener('click', e => this.updateTab(e))
    }

    async updateTab(event) {
        const button = event.target;

        if (!button.classList.contains('tab-btn') || button.classList.contains('active')) {
            return;
        }

        this.currentBtn.classList.remove('active');
        button.classList.add('active');
        this.currentBtn = button;

        const newTabPage = document.querySelector(`[data-tabname="${event.target.innerText}"]`);

        this.currentTabPage.classList.add('is-hidden');
        newTabPage.classList.remove('is-hidden');

        this.currentTabPage = newTabPage;
    }
}