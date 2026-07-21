export class DocumentRepository {


    async findAll() {

        return [];

    }


    async findById(
        id: string
    ) {

        return null;

    }


    async create(
        data: unknown
    ) {

        return data;

    }


    async update(
        id: string,
        data: unknown
    ) {

        return {

            id,

            ...data as object

        };

    }


    async delete(
        id: string
    ) {

        return true;

    }

}