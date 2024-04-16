const NotFound = {
    template: "#page-not-found",
    created() {
        document.title = "TaskFlow | Página não encontrada";
        this.$root.selectedTopicName = null;
    }
}

export default NotFound;