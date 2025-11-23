#include <eosio/eosio.hpp>

using namespace eosio;

class [[eosio::contract]] test : public contract {
  public:
    using contract::contract;

    [[eosio::action]]
    void hi(name user) {
        print("Hello, ", user);
    }

    struct [[eosio::table]] message {
        uint64_t    id;
        std::string text;

        uint64_t primary_key() const { return id; }
    };

    using message_table = eosio::multi_index<"messages"_n, message>;

    [[eosio::action]]
    void addmsg(uint64_t id, std::string text) {
        message_table messages(get_self(), get_self().value);
        messages.emplace(get_self(), [&](auto& row) {
            row.id = id;
            row.text = text;
        });
    }
};


