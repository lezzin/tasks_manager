import { PAGE_TITLES } from "../utils.js";

const NotFound = {
    template: "#page-not-found",
    created() {
        document.title = PAGE_TITLES.not_found;
        this.$root.selectedTopicName = null;
        this.$root.showBtn = false;
    }
}

export default NotFound;