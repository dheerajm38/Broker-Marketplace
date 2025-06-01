export const generatePrivateRoomId = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort();
    return `room_${sortedIds[0]}_${sortedIds[1]}`;
}