export type TRoomId = Lowercase<string> & { _opaque: typeof TRoomId };
declare const TRoomId: unique symbol;

export type TRoomName = Lowercase<string> & { _opaque: typeof TRoomName };
declare const TRoomName: unique symbol;
