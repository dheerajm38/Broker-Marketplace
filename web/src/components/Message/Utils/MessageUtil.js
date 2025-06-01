export const sortMessages = (messages) => {
    return messages.sort((a, b) => (a.createdAt) - (b.createdAt));
}