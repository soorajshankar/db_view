import utils from '../components/utils/utils';
import DbSession, {
  ColumnName,
  SortColumnType,
  SqlExecReponseType,
  TableType,
} from './DbSession';

class PgSession implements DbSession {
  id: string;

  constructor(message: string) {
    this.id = message;
  }

  executeSQL = (sql: string): Promise<SqlExecReponseType> =>
    new Promise<SqlExecReponseType>((resolve, reject) => {
      utils.executeSQL(sql, this.id).then(resolve).catch(reject);
    });

  getDBSchemas = (): Promise<string[]> =>
    new Promise<string[]>((resolve, reject) => {
      const sql = `SELECT schema_name
      FROM information_schema.schemata
      WHERE "schema_name" NOT LIKE 'pg_%' AND schema_name <> 'information_schema';`;
      utils
        .executeSQL(sql, this.id)
        .then((data) => {
          if (data?.rows && Array.isArray(data?.rows)) {
            const allSchamas = data?.rows
              .filter((i) => !!i?.schema_name)
              .map((i) => i.schema_name);
            return resolve(allSchamas);
          }
          return reject(new Error('Failed to parse the schemas'));
        })
        .catch(reject);
    });

  getAllTables = (schema: string): Promise<TableType[]> =>
    new Promise<TableType[]>((resolve, reject) => {
      const sql = `SELECT * FROM information_schema.tables
      WHERE table_schema = '${schema}'`;
      utils
        .executeSQL(sql, this.id)
        .then((data) => {
          if (data?.rows && Array.isArray(data?.rows)) {
            const allSchamas = data?.rows.filter(
              (i) => !!i?.table_name
            ) as TableType[];
            return resolve(allSchamas);
          }
          return reject(new Error('Failed to parse the schemas'));
        })
        .catch(reject);
    });

  getTableData = ({
    schema,
    table,
    pagenumber = 1,
    size = 50,
    sortedColumns,
  }: {
    schema: string;
    table: string;
    offset: number;
    pagenumber: number;
    size: number;
    sortedColumns?: SortColumnType;
  }): Promise<{ status: string; rows: Record<string, unknown>[] }> =>
    new Promise<{ status: string; rows: Record<string, unknown>[] }>(
      (resolve, reject) => {
        const offset = (pagenumber - 1) * size;
        let sql = `SELECT * FROM "${schema}"."${table}" `;
        if (sortedColumns) {
          sql += ' ORDER BY ';
          sql += Object.entries(sortedColumns)
            .map(([col, sort]) => `${col} ${sort}`)
            .join(',');
        }

        sql += ` LIMIT ${size} OFFSET ${offset};`;
        utils
          .executeSQL(sql, this.id)
          .then((data) => {
            const tableData = data as unknown;
            return resolve(
              tableData as { status: string; rows: Record<string, unknown>[] }
            );
          })
          .catch(reject);
      }
    );

  getColumnNames = ({
    schema,
    table,
  }: {
    schema: string;
    table: string;
  }): Promise<{ status: string; rows: ColumnName[] }> =>
    new Promise<{ status: string; rows: ColumnName[] }>((resolve, reject) => {
      const sql = `SELECT
      column_name,
      data_type
    FROM
      INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_NAME = '${table}'
      AND table_schema = '${schema}';`;

      utils
        .executeSQL(sql, this.id)
        .then((data) => {
          const columnNames = data as unknown;
          return resolve(columnNames as { status: string; rows: ColumnName[] });
        })
        .catch(reject);
    });
  // TODO
  // getTableList = (): Promise<SqlExecReponseType> =>{}
  // getTableData = (schema,tablename,offset,size): Promise<SqlExecReponseType> =>{}
  // getViewData = (schema,tablename,offset,size): Promise<SqlExecReponseType> =>{}
}

export default PgSession;
