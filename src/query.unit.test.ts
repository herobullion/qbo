import { combine, fetchListQuery, optsToListQueryCondition, QueryOptsBase, QueryOptsInternal } from "./list";
import { QBOQueryableEntityType, SnakeToCamelCase } from "./lib/types";
import { Config } from "./lib/config";
import "ts-error-as-value/lib/globals";

describe("combine", () => {
  it("should correctly combine two QueryResponses", () => {
    const mockEntity: SnakeToCamelCase<QBOQueryableEntityType> = "Account";
    const mockFirstQueryResponse = {
      time: "2023-07-04T00:00:00.000Z",
      QueryResponse: {
        maxResults: 10,
        startPosition: 1,
        [mockEntity]: ["first1", "first2", "first3"]
      }
    };
    const mockSecondQueryResponse = {
      time: "2023-07-04T00:01:00.000Z",
      QueryResponse: {
        maxResults: 20,
        startPosition: 2,
        [mockEntity]: ["second1", "second2", "second3"]
      }
    };

    const expectedResult = {
      time: "2023-07-04T00:01:00.000Z",
      QueryResponse: {
        maxResults: 20,
        startPosition: 2,
        [mockEntity]: ["first1", "first2", "first3", "second1", "second2", "second3"]
      }
    };

    const result = combine(mockEntity, mockFirstQueryResponse as any, mockSecondQueryResponse as any);
    expect(result).toEqual(expectedResult);
  });
});

describe("optsToQuery", () => {
  it("should return an empty string when the input object is empty", () => {
    const opts = {
      fetch_all: false,
      limit: 10,
      offset: 0
    };

    const result = optsToListQueryCondition<QBOQueryableEntityType>(opts);

    expect(result).toEqual("");
  });

  it("should generate a where clause correctly", () => {
    const opts: QueryOptsBase<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [
        {
          field: "BirthDate",
          value: "2022-03-10",
          operator: "="
        }
      ]
    };

    const result = optsToListQueryCondition<"employee">({
      ...(opts ?? {}),
      fetch_all: !!opts?.fetch_all,
      offset: opts?.offset ?? 1,
      limit: opts?.limit ?? 1000
    });

    expect(result).toEqual("where BirthDate = '2022-03-10'");

  });

  it("should generate an order by clause correctly", () => {
    const opts: QueryOptsBase<"customer"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      asc: "WebAddr"
    };

    const result = optsToListQueryCondition<"customer">({
      ...(opts ?? {}),
      fetch_all: !!opts?.fetch_all,
      offset: opts?.offset ?? 1,
      limit: opts?.limit ?? 1000
    });

    expect(result).toEqual("orderby WebAddr asc");
  });

  it("should handle multiple fields in the where clause with AND operator correctly", () => {
    const opts: QueryOptsBase<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [
        {
          field: "BirthDate",
          value: "2022-03-10",
          operator: "="
        },
        {
          field: "FamilyName",
          value: "John",
          operator: "LIKE"
        }
      ]
    };

    const result = optsToListQueryCondition<"employee">({
      ...(opts ?? {}),
      fetch_all: !!opts?.fetch_all,
      offset: opts?.offset ?? 1,
      limit: opts?.limit ?? 1000
    });

    expect(result).toEqual("where BirthDate = '2022-03-10' and FamilyName LIKE 'John'");
  });

  it("should handle adding asc or desc with where conditions", () => {
    const opts: QueryOptsBase<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      asc: "BirthDate",
      where: [
        {
          field: "BirthDate",
          value: "2022-03-10",
          operator: "="
        },
        {
          field: "FamilyName",
          value: "John",
          operator: "LIKE"
        }
      ]
    };

    const result = optsToListQueryCondition<"employee">({
      ...(opts ?? {}),
      fetch_all: !!opts?.fetch_all,
      offset: opts?.offset ?? 1,
      limit: opts?.limit ?? 1000
    });

    expect(result).toEqual("where BirthDate = '2022-03-10' and FamilyName LIKE 'John' orderby BirthDate asc");

    const opts2: QueryOptsBase<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [
        {
          field: "BirthDate",
          value: "2022-03-10",
          operator: "="
        }
      ],
      asc: "BirthDate"
    };

    const result2 = optsToListQueryCondition<"employee">({
      ...(opts2 ?? {}),
      fetch_all: !!opts2?.fetch_all,
      offset: opts2?.offset ?? 1,
      limit: opts2?.limit ?? 1000
    });

    expect(result2).toEqual("where BirthDate = '2022-03-10' orderby BirthDate asc");
  });

  it("should handle adding asc or desc without any where conditions", () => {
    const opts: QueryOptsBase<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [],
      asc: "BirthDate"
    };

    const result = optsToListQueryCondition<"employee">({
      ...(opts ?? {}),
      fetch_all: !!opts?.fetch_all,
      offset: opts?.offset ?? 1,
      limit: opts?.limit ?? 1000
    });

    expect(result).toEqual("orderby BirthDate asc");

    const opts2: QueryOptsBase<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [],
      desc: "BirthDate"
    };

    const result2 = optsToListQueryCondition<"employee">({
      ...(opts2 ?? {}),
      fetch_all: !!opts2?.fetch_all,
      offset: opts2?.offset ?? 1,
      limit: opts2?.limit ?? 1000
    });

    expect(result2).toEqual("orderby BirthDate desc");
  });

  it("should return no where conditions when no where conditions are provided", () => {
    const opts: QueryOptsBase<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: []
    };

    const result = optsToListQueryCondition<"employee">({
      ...(opts ?? {}),
      fetch_all: !!opts?.fetch_all,
      offset: opts?.offset ?? 1,
      limit: opts?.limit ?? 1000
    });

    expect(result).toEqual("");
  });
});

describe("fetchQuery", () => {
  const config: Config = {
    TOKEN_URL: "https://localhost.com/token",
    REVOKE_URL: "https://localhost.com/revok",
    USER_INFO_URL: "https://localhost.com/user_info",
    AUTHORIZATION_URL: "https://localhost.com/auth",
    APP_CENTER_BASE: "app_center_base",
    V3_ENDPOINT_BASE_URL: "https://localhost.com/api",
    REFRESH_TOKEN: "refresh_token",
    ACCESS_TOKEN: "access_token",
    REALM_ID: "realm_id"
  };

  it("should make a fetch request with the correct parameters", async () => {
    const opts: QueryOptsInternal<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [
        {
          field: "BirthDate",
          value: "2022-03-10",
          operator: "="
        }
      ]
    };

    const headers = { "Content-Type": "application/json" };

    // @ts-ignore
    const fetchFn: any = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      expect(url).toBe("https://localhost.com/apirealm_id/query?limit=10&offset=0&query=select%20*%20from%20Employee%20where%20BirthDate%20%3D%20%272022-03-10%27&minorversion=75");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ QueryResponse: { Employee: [] } })
      });
    });

    await fetchListQuery({
      config,
      opts,
      Entity: "Employee",
      headers,
      fetchFn
    });

    expect(fetchFn).toHaveBeenCalled();
  });

  it("when the response from fetch's ok property is false, it should throw an error", async () => {
    const opts: QueryOptsInternal<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [
        {
          field: "BirthDate",
          value: "2022-03-10",
          operator: "="
        }
      ]
    };

    const headers = { "Content-Type": "application/json" };

    // @ts-ignore
    const fetchFn: any = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      expect(url).toBe("https://localhost.com/apirealm_id/query?limit=10&offset=0&query=select%20*%20from%20Employee%20where%20BirthDate%20%3D%20%272022-03-10%27&minorversion=75");
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ QueryResponse: { Employee: [] } })
      });
    });

    await expect(() => (
      fetchListQuery({
        config,
        opts,
        Entity: "Employee",
        headers,
        fetchFn
      }).then(result => result.successOrThrow())
    )).rejects.toThrowError();

    expect(fetchFn).toHaveBeenCalled();
  });

  it("should return the correct data from the fetch request", async () => {
    const opts: QueryOptsInternal<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0,
      where: [
        {
          field: "BirthDate",
          value: "2022-03-10",
          operator: "="
        }
      ]
    };

    const headers = { "Content-Type": "application/json" };

    const expectedData = { QueryResponse: { Employee: [] }, intuitTid: null };

    const fetchFn: any = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(expectedData)
    }));

    const {
      data: result, error
    } = await fetchListQuery({
      config,
      opts,
      Entity: "Employee",
      headers,
      fetchFn
    });

    expect(error).toBeNull();
    expect(result).toEqual(expectedData);
  });

  it("should handle the fetch_all option correctly", async () => {
    const opts: QueryOptsInternal<"employee"> = {
      fetch_all: true,
      limit: 10,
      offset: 0
    };

    const headers = { "Content-Type": "application/json" };

    const expectedData = { QueryResponse: { Employee: new Array(10).fill({}) } };

    const fetchFn = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(expectedData)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ QueryResponse: { Employee: [] } })
      }));

    const {
      data: result, error
    } = await fetchListQuery({
      config,
      opts,
      Entity: "Employee",
      headers,
      fetchFn
    });
    console.log();
    expect(error).toBeNull();
    expect(result).toEqual(expectedData);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("should handle errors correctly", async () => {
    const opts: QueryOptsInternal<"employee"> = {
      fetch_all: false,
      limit: 10,
      offset: 0
    };

    const headers = { "Content-Type": "application/json" };

    const fetchFn = jest.fn(() => Promise.reject("Network error"));

    try {
      await fetchListQuery({
        config,
        opts,
        Entity: "Employee",
        headers,
        fetchFn
      });
    } catch (error) {
      expect(error).toEqual("Network error");
    }
  });

  it("should combine responses correctly when fetch_all is true and more data is available", async () => {
    const opts: QueryOptsInternal<"employee"> = {
      fetch_all: true,
      limit: 2,
      offset: 0
    };

    const headers = { "Content-Type": "application/json" };

    const fetchFn = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ QueryResponse: { Employee: [{ Id: "1" }, { Id: "2" }] } })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ QueryResponse: { Employee: [{ Id: "3" }] } })
      }));

    const {
      data: result, error
    } = await fetchListQuery({
      config,
      opts,
      Entity: "Employee",
      headers,
      fetchFn
    });

    expect(error).toBeNull();
    expect(result).toEqual({ QueryResponse: { Employee: [{ Id: "1" }, { Id: "2" }, { Id: "3" }] } });
  });
});

