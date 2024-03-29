#include "Machine/MessageBus/MachineRouter.hpp"
#include "Logging/Logger.hpp"
#include "Machine/MessageBus/Messages.hpp"

namespace Machine::MessageBus
{
    MachineRouter::MachineRouter(Machine::FSM::MachineFSM* fsm) : myFsm(fsm)
    {
        myFsm->start();
    }

    void MachineRouter::on_receive(const etl::imessage& msg)
    {
        myFsm->receive(msg);
        ELSF_LOG_INFO("MachineRouter received message: $d", msg.get_message_id());
    }

    void MachineRouter::on_receive_unknown(const etl::imessage& msg)
    {
        ELSF_LOG_WARN("MachineRouter received unknown message. This shouldn't happen because of the broker.");
    }

    void MachineRouter::Start()
    {
        myFsm->start();
    }

} // namespace Machine::MessageBus

