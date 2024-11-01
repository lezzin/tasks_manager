import { PAGE_TITLES } from "../utils/variables.js";

const NotFound = {
    template: "#not-found-page",
    mounted() {
        document.title = PAGE_TITLES.not_found;
        this.$root.showBtn = false;
    },
};

export default NotFound;
