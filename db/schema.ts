import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const methodMetadata = sqliteTable('method_metadata', {
  methodId: text('method_id').primaryKey(),
  metadata: text('metadata').notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});
// Live session board. The board id is an unguessable token: anyone holding the link can upload, comment and delete.
export const board = sqliteTable('board', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  context: text('context').notNull().default(''),
  sections: text('sections').notNull(),
  planId: text('plan_id').notNull(),
  // Approved plan snapshot (intake + activities) so the session runner can show instructions.
  plan: text('plan'),
  currentSection: text('current_section'),
  startedAt: text('started_at'),
  createdAt: text('created_at').notNull(),
});
export const boardItem = sqliteTable('board_item', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull(),
  sectionId: text('section_id').notNull(),
  kind: text('kind').notNull(),
  objectKey: text('object_key'),
  contentType: text('content_type'),
  text: text('text').notNull().default(''),
  author: text('author').notNull().default(''),
  width: integer('width'),
  height: integer('height'),
  fileName: text('file_name'),
  createdAt: text('created_at').notNull(),
  deletedAt: text('deleted_at'),
}, t => [index('board_item_board_idx').on(t.boardId)]);
export const boardComment = sqliteTable('board_comment', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull(),
  boardId: text('board_id').notNull(),
  author: text('author').notNull().default(''),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
}, t => [index('board_comment_board_idx').on(t.boardId)]);
// One filled-in method template per agenda block; mode 'manual' means the group worked on paper.
export const boardTemplate = sqliteTable('board_template', {
  boardId: text('board_id').notNull(),
  sectionId: text('section_id').notNull(),
  mode: text('mode').notNull(),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
  completedAt: text('completed_at'),
}, t => [primaryKey({ columns: [t.boardId, t.sectionId] })]);
