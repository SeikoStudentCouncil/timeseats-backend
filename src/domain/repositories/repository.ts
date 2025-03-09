import type { ID } from "../types/id.js";

// リポジトリの基本的な操作を提供するインターフェース
export interface Repository<T> {
    /**
     * IDによる検索
     * @param id 検索するID
     */
    findById(id: ID): Promise<T | null>;

    /**
     * 全件取得
     */
    findAll(): Promise<T[]>;

    /**
     * エンティティの作成
     * @param entity 作成するエンティティ
     */
    create(entity: Omit<T, "id">): Promise<void>;

    /**
     * エンティティの更新
     * @param id 更新するエンティティのID
     * @param entity 更新内容
     */
    update(id: ID, entity: Partial<T>): Promise<void>;

    /**
     * エンティティの削除
     * @param id 削除するエンティティのID
     */
    delete(id: ID): Promise<void>;
}
