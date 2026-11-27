using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace Zirve.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEnglishContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "tracks",
                type: "character varying(600)",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "title_en",
                table: "tracks",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "quizzes",
                type: "character varying(600)",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "title_en",
                table: "quizzes",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "explanation_en",
                table: "questions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "text_en",
                table: "questions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "text_en",
                table: "question_options",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "editorial_en",
                table: "problems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "hints_en",
                table: "problems",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<string>(
                name: "solutions_json_en",
                table: "problems",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'{}'::jsonb");

            migrationBuilder.AddColumn<string>(
                name: "statement_en",
                table: "problems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "title_en",
                table: "problems",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "modules",
                type: "character varying(600)",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "title_en",
                table: "modules",
                type: "character varying(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "content_en",
                table: "lessons",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "summary_en",
                table: "lessons",
                type: "character varying(600)",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "title_en",
                table: "lessons",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            // Üretilen arama sütunları, dayandıkları metin sütunlarından SONRA eklenmeli.
            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "search_vector_en",
                table: "problems",
                type: "tsvector",
                nullable: false)
                .Annotation("Npgsql:TsVectorConfig", "english")
                .Annotation("Npgsql:TsVectorProperties", new[] { "title_en", "statement_en" });

            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "search_vector_en",
                table: "lessons",
                type: "tsvector",
                nullable: false)
                .Annotation("Npgsql:TsVectorConfig", "english")
                .Annotation("Npgsql:TsVectorProperties", new[] { "title_en", "summary_en", "content_en" });

            migrationBuilder.CreateIndex(
                name: "ix_problems_search_vector_en",
                table: "problems",
                column: "search_vector_en")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "ix_lessons_search_vector_en",
                table: "lessons",
                column: "search_vector_en")
                .Annotation("Npgsql:IndexMethod", "GIN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_problems_search_vector_en",
                table: "problems");

            migrationBuilder.DropIndex(
                name: "ix_lessons_search_vector_en",
                table: "lessons");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "tracks");

            migrationBuilder.DropColumn(
                name: "title_en",
                table: "tracks");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "quizzes");

            migrationBuilder.DropColumn(
                name: "title_en",
                table: "quizzes");

            migrationBuilder.DropColumn(
                name: "explanation_en",
                table: "questions");

            migrationBuilder.DropColumn(
                name: "text_en",
                table: "questions");

            migrationBuilder.DropColumn(
                name: "text_en",
                table: "question_options");

            migrationBuilder.DropColumn(
                name: "editorial_en",
                table: "problems");

            migrationBuilder.DropColumn(
                name: "hints_en",
                table: "problems");

            migrationBuilder.DropColumn(
                name: "search_vector_en",
                table: "problems");

            migrationBuilder.DropColumn(
                name: "solutions_json_en",
                table: "problems");

            migrationBuilder.DropColumn(
                name: "statement_en",
                table: "problems");

            migrationBuilder.DropColumn(
                name: "title_en",
                table: "problems");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "title_en",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "content_en",
                table: "lessons");

            migrationBuilder.DropColumn(
                name: "search_vector_en",
                table: "lessons");

            migrationBuilder.DropColumn(
                name: "summary_en",
                table: "lessons");

            migrationBuilder.DropColumn(
                name: "title_en",
                table: "lessons");
        }
    }
}
